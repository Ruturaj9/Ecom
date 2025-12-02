const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const validateRequest = require('../middleware/validateRequest');
const { toMs } = require('../utils/time');

const ACCESS_EXP = process.env.ACCESS_TOKEN_EXPIRES;
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXPIRES;

const signAccess = (user) =>
  jwt.sign(
    { sub: user._id.toString(), roles: user.roles || [] },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXP }
  );

const signRefresh = (user) =>
  jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXP }
  );

const hashToken = (t) =>
  crypto.createHash("sha256").update(t).digest("hex");

module.exports = (csrfProtection) => {
  const router = express.Router();

  // REGISTER
  router.post(
    "/register",
    [
      body("email").isEmail().withMessage("Valid email required"),
      body("password").isLength({ min: 8 }),
      body("name").optional().isString()
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        const { email, password, name } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ error: "Email already used" });

        const hash = await bcrypt.hash(password, 12);
        const user = new User({ email, passwordHash: hash, name });

        await user.save();
        res.status(201).json({ message: "User registered" });
      } catch (err) {
        next(err);
      }
    }
  );

  // LOGIN
  router.post(
    "/login",
    [
      body("email").isEmail(),
      body("password").isString()
    ],
    validateRequest,
    csrfProtection,
    async (req, res, next) => {
      try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: "Invalid credentials" });

        const access = signAccess(user);
        const refresh = signRefresh(user);

        const tokenHash = hashToken(refresh);
        const exp = new Date(Date.now() + toMs(REFRESH_EXP));

        user.refreshTokens.push({ tokenHash, expiresAt: exp });
        await user.save();

        res.cookie("refreshToken", refresh, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: toMs(REFRESH_EXP),
          domain: process.env.COOKIE_DOMAIN
        });

        res.json({ accessToken: access });
      } catch (err) {
        next(err);
      }
    }
  );

  // REFRESH TOKEN
  router.post("/refresh", async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json({ error: "No refresh token" });

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      } catch {
        return res.status(401).json({ error: "Refresh token invalid" });
      }

      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ error: "User not found" });

      const hash = hashToken(token);
      const match = user.refreshTokens.find(
        (t) => t.tokenHash === hash && t.expiresAt > new Date()
      );

      if (!match)
        return res.status(401).json({ error: "Refresh token expired or revoked" });

      // ROTATE TOKENS
      const newRefresh = signRefresh(user);
      const newHash = hashToken(newRefresh);
      const newExp = new Date(Date.now() + toMs(REFRESH_EXP));

      user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== hash);
      user.refreshTokens.push({ tokenHash: newHash, expiresAt: newExp });

      await user.save();

      res.cookie("refreshToken", newRefresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: toMs(REFRESH_EXP),
        domain: process.env.COOKIE_DOMAIN
      });

      res.json({ accessToken: signAccess(user) });
    } catch (err) {
      next(err);
    }
  });

  // LOGOUT
  router.post("/logout", async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken;
      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
          const user = await User.findById(payload.sub);

          if (user) {
            const hash = hashToken(token);
            user.refreshTokens = user.refreshTokens.filter(
              (t) => t.tokenHash !== hash
            );
            await user.save();
          }
        } catch {}
      }

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        domain: process.env.COOKIE_DOMAIN
      });

      res.json({ message: "Logged out" });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
