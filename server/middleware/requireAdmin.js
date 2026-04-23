/**
 * requireAdmin — must be used after authenticate middleware.
 * Blocks access if user role is not 'admin'.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
  next();
};

module.exports = requireAdmin;
