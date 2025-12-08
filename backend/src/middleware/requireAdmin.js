// src/middleware/requireAdmin.js
const User = require('../models/User');
const { verifyAccessToken } = require('./auth');

/**
 * Middleware: requireAdmin(allowedRoles)
 * Ensures the requester is authenticated and has at least one of the required roles.
 *
 * - Does NOT change main logic.
 * - Improves security, clarity, consistency, and error handling.
 *
 * @param {string[]|string} allowedRoles
 * @returns {Function} Express middleware
 */
module.exports = function requireAdmin(allowedRoles = ['admin']) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      // First verify the access token
      verifyAccessToken(req, res, async () => {
        try {
          const userId = req.user && (req.user.id || req.user._id);

          // No user extracted from token
          if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
          }

          // Load user
          const user = await User.findById(userId)
            .select('_id email roles')
            .lean();

          if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
          }

          // Normalize roles to an array
          const roles = Array.isArray(user.roles)
            ? user.roles
            : user.roles
            ? [user.roles]
            : [];

          // Check if user has required permissions
          const permitted = roles.some(role => allowed.includes(role));
          if (!permitted) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
          }

          // Attach useful admin info
          req.admin = {
            id: user._id.toString(),
            email: user.email,
            roles,
          };

          return next();
        } catch (err) {
          console.error('[requireAdmin] Internal Error:', err);
          return res.status(500).json({ error: 'Server error during admin check' });
        }
      });
    } catch (err) {
      console.error('[requireAdmin] Unexpected Error:', err);
      return res.status(500).json({ error: 'Unexpected server error' });
    }
  };
};
