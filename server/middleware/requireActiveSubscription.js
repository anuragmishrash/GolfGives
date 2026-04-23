/**
 * requireActiveSubscription — must be used after authenticate middleware.
 * Blocks access if user subscription is not 'active'.
 */
const requireActiveSubscription = (req, res, next) => {
  if (!req.user || req.user.subscriptionStatus !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required. Please subscribe to access this feature.',
      code: 'SUBSCRIPTION_INACTIVE',
    });
  }
  next();
};

module.exports = requireActiveSubscription;
