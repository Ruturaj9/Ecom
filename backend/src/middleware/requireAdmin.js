// src/middleware/requireAdmin.js

const User = require('../models/User');
const { verifyAccessToken } = require('./auth');

/**
 * Middleware to protect admin-only routes.
 * Usage: app.use('/admin', requireAdmin());
 */
module.exports = function requireAdmin(allowedRoles = ['admin']) {
  return async (req, res, next) => {
    try {
      // Step 1: First verify the access token
      verifyAccessToken(req, res, async () => {

        const userId = req.user?.id;  // set by verifyAccessToken
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized (no user)' });
        }

        // Step 2: Load user from DB
        const user = await User.findById(userId).lean();
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Step 3: Check roles
        const hasRole = user.roles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
          return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        // Step 4: Attach user info for admin logs later
        req.admin = {
          id: user._id.toString(),
          email: user.email,
          roles: user.roles
        };

        return next();
      });

    } catch (err) {
      return res.status(500).json({ error: 'Server error in admin check' });
    }
  };
};
