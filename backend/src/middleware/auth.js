// src/middleware/auth.js
const jwt = require("jsonwebtoken");

/**
 * verifyAccessToken middleware
 * Supports:
 *   - Authorization header: "Bearer <token>"
 *   - Cookie: accessToken
 */
const verifyAccessToken = (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check Authorization header
    const header = req.headers.authorization || req.headers.Authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    }

    // 2️⃣ If missing, check cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: "No access token provided" });
    }

    // 3️⃣ Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      console.error("[verifyAccessToken] Token verify error:", err.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 4️⃣ Accept tokens with sub (your login uses sub)
    const userId = payload.sub || payload.id || payload.userId;
    const roles = Array.isArray(payload.roles) ? payload.roles : [];

    if (!userId) {
      console.error("[verifyAccessToken] Missing user id in token:", payload);
      return res.status(401).json({ error: "Token missing user identifier" });
    }

    // 5️⃣ Attach decoded user to req
    req.user = { id: userId, roles };

    return next();

  } catch (err) {
    console.error("[verifyAccessToken] Unexpected error:", err);
    return res.status(401).json({ error: "Authorization failed" });
  }
};

module.exports = { verifyAccessToken };
