// src/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * verifyAccessToken middleware
 *
 * - Preserves all existing logic exactly.
 * - Improves structure, reliability, readability, and security.
 * - Supports:
 *     • Authorization header: "Bearer <token>"
 *     • Cookie: accessToken
 */
const verifyAccessToken = (req, res, next) => {
  try {
    let token;

    /* ------------------------------------------------------
       1) Authorization Header
    ------------------------------------------------------- */
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    /* ------------------------------------------------------
       2) Cookies
    ------------------------------------------------------- */
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    /* ------------------------------------------------------
       3) Missing Token
    ------------------------------------------------------- */
    if (!token) {
      return res.status(401).json({ error: 'No access token provided' });
    }

    /* ------------------------------------------------------
       4) Verify Token
    ------------------------------------------------------- */
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      console.error('[verifyAccessToken] Token verification error:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    /* ------------------------------------------------------
       5) Extract User Fields
          (preserving your existing logic: sub → id → userId)
    ------------------------------------------------------- */
    const userId = payload.sub || payload.id || payload.userId;
    const roles = Array.isArray(payload.roles) ? payload.roles : [];

    if (!userId) {
      console.error('[verifyAccessToken] Missing user id in token:', payload);
      return res.status(401).json({ error: 'Token missing user identifier' });
    }

    /* ------------------------------------------------------
       6) Attach to req for downstream middlewares
    ------------------------------------------------------- */
    req.user = { id: userId, roles };

    return next();
  } catch (err) {
    console.error('[verifyAccessToken] Unexpected error:', err);
    return res.status(401).json({ error: 'Authorization failed' });
  }
};

module.exports = { verifyAccessToken };
