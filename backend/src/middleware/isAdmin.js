// src/middleware/isAdmin.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * isAdmin middleware
 *
 * - Core logic preserved exactly.
 * - Updated to match your actual backend structure:
 *   ✔ uses JWT_ACCESS_SECRET (your real secret)
 *   ✔ uses roles array instead of single role field
 * - Adds safer token parsing & consistent responses
 * - Adds non-crashing fallbacks
 */
module.exports = async function isAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token' });
    }

    const token = auth.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Payload may contain: sub, roles, userId
    const userId = payload.sub || payload.id || payload.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Token missing user id' });
    }

    // DB lookup to confirm user still exists
    const user = await User.findById(userId).select('roles email name');
    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    // User has roles array: ['user', 'admin', ...]
    const roles = Array.isArray(user.roles) ? user.roles : [];
    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Admin only' });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error('isAdmin error:', err);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
