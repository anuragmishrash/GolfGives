const { supabase } = require('../lib/supabase');

/**
 * authenticate — Verifies the Supabase JWT access token from the Authorization header.
 * Fetches the full profile from the `profiles` table and attaches it to req.user.
 * Maintains backward-compat: req.user._id alias maps to req.user.id (UUID).
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token with Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'TOKEN_EXPIRED' });
    }

    // Fetch full profile (role, subscription status, etc.)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ success: false, message: 'User profile not found' });
    }

    // Attach to req.user with _id alias for backward compatibility
    req.user = {
      ...profile,
      id: profile.id,
      _id: profile.id,                          // backward compat alias
      name: profile.full_name,                  // backward compat alias
      subscriptionStatus: profile.subscription_status,  // camelCase alias
      subscriptionPlan: profile.subscription_plan,
      stripeCustomerId: profile.stripe_customer_id,
      stripeSubscriptionId: profile.stripe_subscription_id,
      selectedCharityId: profile.charity_id,
      charityContributionPercent: profile.charity_percentage,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed', code: 'TOKEN_EXPIRED' });
  }
};

module.exports = authenticate;
