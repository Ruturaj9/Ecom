// src/middleware/requireAdmin.js
const User = require('../models/User');
const { verifyAccessToken } = require('./auth');

/**
 * requireAdmin(allowedRoles)
 * - allowedRoles: array of role names that are allowed (default ['admin'])
 *
 * Usage:
 *   // Protect a route
 *   router.get('/admin-only', requireAdmin(['admin', 'super-admin']), adminHandler);
 *
 *   // Or apply to a router
 *   app.use('/admin', requireAdmin()); // all /admin routes require admin
 */
module.exports = function requireAdmin(allowedRoles = ['admin']) {
  // Normalize allowedRoles
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      // First verify token. We pass a next() callback that continues below.
      verifyAccessToken(req, res, async () => {
        try {
          const userId = req.user && (req.user.id || req.user._id);
          if (!userId) {
            return res.status(401).json({ error: 'Unauthorized (no user in token)' });
          }

          // Load user from DB
          const user = await User.findById(userId).lean();
          if (!user) {
            return res.status(401).json({ error: 'User not found' });
          }

          // Normalise roles (ensure it's an array)
          const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : []);

          // Check for at least one allowed role
          const hasRole = roles.some(role => allowed.includes(role));
          if (!hasRole) {
            return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
          }

          // Attach admin info for downstream handlers
          req.admin = {
            id: user._id.toString(),
            email: user.email,
            roles
          };

          return next();
        } catch (err) {
          console.error('[requireAdmin] error inside admin check:', err);
          return res.status(500).json({ error: 'Server error in admin check' });
        }
      });
    } catch (err) {
      console.error('[requireAdmin] unexpected error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };
};
