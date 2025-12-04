// middleware/isAdmin.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function isAdmin(req, res, next) {
  try {
    // assuming you store token in Authorization: Bearer <token>
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No token' });

    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // you can store role in token to avoid DB lookup, but double-check in DB for revocation
    const user = await User.findById(payload.id).select('role email name');
    if (!user) return res.status(401).json({ message: 'Invalid user' });

    if (user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error('isAdmin err', err);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
