const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcrypt'); // if you used bcryptjs, require('bcryptjs')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const validateRequest = require('../middleware/validateRequest');

const ACCESS_EXP = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXPIRES || '7d';

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

module.exports = (csrfProtection) => {
  const router = express.Router();

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

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const user = new User({ email, passwordHash, name });
        await user.save();

        res.status(201).json({ message: 'User created' });
      } catch (err) {
        next(err);
      }
    }
  );

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

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        const refreshHash = hashToken(refreshToken);
        const refreshExpiry = new Date(Date.now() + msToMs(REFRESH_EXP));

        user.refreshTokens.push({
          tokenHash: refreshHash,
          expiresAt: refreshExpiry
        });
        await user.save();

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: msToMs(REFRESH_EXP),
          domain: process.env.COOKIE_DOMAIN || undefined
        });

        res.json({ accessToken });
      } catch (err) {
        next(err);
      }
    }
  );

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

      const userId = payload.sub;
      const user = await User.findById(userId);
      if (!user) return res.status(401).json({ error: 'User not found' });

      const tokenHash = hashToken(token);
      const match = user.refreshTokens.find(rt => rt.tokenHash === tokenHash && rt.expiresAt > new Date());
      if (!match) return res.status(401).json({ error: 'Refresh token revoked or expired' });

      const accessToken = signAccessToken(user);

      const newRefreshToken = signRefreshToken(user);
      const newHash = hashToken(newRefreshToken);
      const newExpiry = new Date(Date.now() + msToMs(REFRESH_EXP));

      user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== tokenHash);
      user.refreshTokens.push({ tokenHash: newHash, expiresAt: newExpiry });
      await user.save();

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: msToMs(REFRESH_EXP),
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  });

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

      res.clearCookie('refreshToken', {
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

function msToMs(str) {
  const num = parseInt(str, 10);
  if (str.endsWith('m')) return num * 60 * 1000;
  if (str.endsWith('h')) return num * 60 * 60 * 1000;
  if (str.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  return num;
}
