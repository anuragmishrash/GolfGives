const { supabase } = require('../lib/supabase');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');

// ── POST /api/auth/register ────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Sign up with Supabase Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (signUpError) {
    // Handle duplicate email gracefully
    if (signUpError.message.toLowerCase().includes('already registered') ||
        signUpError.message.toLowerCase().includes('already exists')) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    return res.status(400).json({ success: false, message: signUpError.message });
  }

  const { user: authUser, session } = authData;
  if (!authUser) {
    return res.status(400).json({ success: false, message: 'Registration failed — no user returned' });
  }

  // The trigger handle_new_user() auto-inserts into profiles, but we upsert to be safe
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.id,
      email: authUser.email,
      full_name: name,
      role: 'subscriber',
      subscription_status: 'inactive',
    });

  if (profileError) {
    console.error('Profile creation error:', profileError.message);
  }

  // Fetch the created profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  // Send welcome email (non-blocking)
  emailService.sendWelcomeEmail({ name, email }).catch(console.error);

  res.status(201).json({
    success: true,
    data: {
      accessToken: session?.access_token || null,
      refreshToken: session?.refresh_token || null,
      user: {
        id: authUser.id,
        name: profile?.full_name || name,
        email: authUser.email,
        role: profile?.role || 'subscriber',
        subscriptionStatus: profile?.subscription_status || 'inactive',
      },
    },
  });
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !authData?.session) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const { user: authUser, session } = authData;

  // Fetch full profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ success: false, message: 'User profile not found' });
  }

  res.json({
    success: true,
    data: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        id: authUser.id,
        name: profile.full_name,
        email: authUser.email,
        role: profile.role,
        subscriptionStatus: profile.subscription_status,
        subscriptionPlan: profile.subscription_plan,
      },
    },
  });
});

// ── POST /api/auth/refresh ─────────────────────────────────────────────────────
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data?.session) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  res.json({
    success: true,
    data: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  });
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  // Supabase stateless — just acknowledge. Frontend clears tokens.
  res.json({ success: true, message: 'Logged out successfully' });
});
