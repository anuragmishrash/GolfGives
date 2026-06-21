const { supabase } = require('../lib/supabase');

/**
 * optionalAuth — Parses Supabase JWT if present and attaches req.user.
 * Does not block the request if token is missing or invalid.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      req.user = null;
      return next();
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    req.user = profile ? { ...profile, id: profile.id, _id: profile.id, name: profile.full_name } : null;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
