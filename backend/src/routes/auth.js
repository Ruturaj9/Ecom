// src/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const validateRequest = require('../middleware/validateRequest');

const ACCESS_EXP = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXPIRES || '7d';

// -----------------------------------------------------
// TOKEN HELPERS
// -----------------------------------------------------

const signAccessToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString(), roles: user.roles || [] },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXP }
  );
};

const signRefreshToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXP }
  );
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

function msToMs(str) {
  const num = parseInt(str, 10);
  if (str.endsWith('m')) return num * 60 * 1000;
  if (str.endsWith('h')) return num * 60 * 60 * 1000;
  if (str.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  return num;
}

// -----------------------------------------------------

module.exports = (csrfProtection) => {
  const router = express.Router();

  // ---------------- REGISTER ----------------
  router.post(
    '/register',
    [
      body('email').isEmail().withMessage('Valid email required'),
      body('password').isLength({ min: 8 }).withMessage('Password min length 8'),
      body('name').optional().isString()
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        const { email, password, name } = req.body;

        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ error: 'Email already in use' });

        const passwordHash = await bcrypt.hash(password, 12);

        // DEFAULT ROLE = user
        const user = new User({ email, passwordHash, name, roles: ['user'] });
        await user.save();

        res.status(201).json({ message: 'User created' });
      } catch (err) {
        next(err);
      }
    }
  );

  // ---------------- LOGIN ----------------
  router.post(
    '/login',
    [
      body('email').isEmail(),
      body('password').isString()
    ],
    validateRequest,
    csrfProtection,
    async (req, res, next) => {
      try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // 1. Check lockout
        if (user.isLocked()) {
          return res.status(423).json({
            error: 'Account locked due to multiple failed attempts. Try again later.'
          });
        }

        // 2. Verify password
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          await user.incFailedLogin();
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Reset lockout counters
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        // 4. Issue tokens
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        // store hashed refresh token
        const refreshHash = hashToken(refreshToken);
        const refreshExpiry = new Date(Date.now() + msToMs(REFRESH_EXP));

        user.refreshTokens.push({
          tokenHash: refreshHash,
          expiresAt: refreshExpiry
        });
        await user.save();

        // 5. Set refresh cookie (long-lived)
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: msToMs(REFRESH_EXP),
          domain: process.env.COOKIE_DOMAIN || undefined
        });

        // 6. ALSO set access token as an httpOnly cookie (short-lived)
        // This allows requireAdmin / verifyAccessToken to read cookie automatically.
        res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: msToMs(ACCESS_EXP),
          domain: process.env.COOKIE_DOMAIN || undefined
        });

        // 7. Return minimal info (optional)
        return res.json({ message: 'Logged in' });
      } catch (err) {
        next(err);
      }
    }
  );

  // ---------------- REFRESH TOKEN ----------------
  router.post('/refresh', async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json({ error: 'No refresh token' });

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ error: 'User not found' });

      const tokenHash = hashToken(token);
      const match = user.refreshTokens.find(
        (rt) => rt.tokenHash === tokenHash && rt.expiresAt > new Date()
      );
      if (!match) return res.status(401).json({ error: 'Refresh token expired/revoked' });

      // rotate
      const newRefreshToken = signRefreshToken(user);
      const newHash = hashToken(newRefreshToken);
      const newExpiry = new Date(Date.now() + msToMs(REFRESH_EXP));

      user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== tokenHash);
      user.refreshTokens.push({ tokenHash: newHash, expiresAt: newExpiry });
      await user.save();

      // set rotated refresh cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: msToMs(REFRESH_EXP),
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      // also set a fresh short-lived access token cookie
      const newAccess = signAccessToken(user);
      res.cookie('accessToken', newAccess, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: msToMs(ACCESS_EXP),
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      return res.json({ accessToken: newAccess });
    } catch (err) {
      next(err);
    }
  });

  // ---------------- LOGOUT ----------------
  router.post('/logout', async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken;

      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
          const user = await User.findById(payload.sub);

          if (user) {
            const tokenHash = hashToken(token);
            user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== tokenHash);
            await user.save();
          }
        } catch (_) {}
      }

      // clear both cookies
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      res.json({ message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
