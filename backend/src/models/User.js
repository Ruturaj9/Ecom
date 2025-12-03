// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { _id: false });

/**
 * Roles: you can extend these later.
 * - superadmin (if needed)
 * - admin
 * - manager
 * - support
 * - user (default)
 */
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, trim: true },
  roles: { type: [String], default: ['user'], index: true },

  // optional security fields for lockout and tracking
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  // rotated refresh tokens
  refreshTokens: [RefreshTokenSchema]
}, { timestamps: true });

// --- Indexes ---
// Text index for basic search across name & email (optional)
UserSchema.index({ email: 1 });

// --- Instance helpers ---

/**
 * Compare a candidate password with the stored hash.
 * Usage: await user.comparePassword('plaintext')
 */
UserSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

/**
 * Check if account is currently locked
 */
UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increment failed login attempts and lock account when threshold reached.
 * This logic is simple — we'll call it from auth logic later.
 */
UserSchema.methods.incFailedLogin = async function({ maxAttempts = 5, lockTimeMs = 15 * 60 * 1000 } = {}) {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockTimeMs);
    this.failedLoginAttempts = 0; // reset after locking
  }
  await this.save();
};

// Export model
module.exports = mongoose.model('User', UserSchema);
