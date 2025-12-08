// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

/**
 * User schema
 * - Main logic preserved.
 * - Adds safe JSON transformation to avoid leaking sensitive fields.
 * - Adds a few small utility methods (non-breaking).
 */
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, default: '' },
    roles: { type: [String], default: ['user'], index: true },

    // security fields
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },

    // rotated refresh tokens
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // remove sensitive/internal fields
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.__v;
        // provide convenience id field
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

/* ---------------------------
   Indexes
----------------------------*/
// Ensure unique index on email (schema-level)
UserSchema.index({ email: 1 }, { unique: true });

/* ---------------------------
   Instance methods
----------------------------*/

/**
 * Compare plaintext password with stored hash.
 * Usage: await user.comparePassword('plaintext')
 */
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

/**
 * Is account locked?
 */
UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increment failed login attempts and lock if threshold reached.
 * - Preserves original logic and defaults.
 * - Call this when a login attempt fails.
 */
UserSchema.methods.incFailedLogin = async function ({
  maxAttempts = 5,
  lockTimeMs = 15 * 60 * 1000,
} = {}) {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockTimeMs);
    this.failedLoginAttempts = 0; // reset after locking
  }
  await this.save();
};

/**
 * Reset failed login counters (useful after successful auth)
 */
UserSchema.methods.resetFailedLogin = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

/**
 * Revoke refresh token by tokenHash
 */
UserSchema.methods.revokeRefreshToken = async function (tokenHash) {
  if (!tokenHash) return;
  this.refreshTokens = (this.refreshTokens || []).filter((rt) => rt.tokenHash !== tokenHash);
  await this.save();
};

/* ---------------------------
   Statics
----------------------------*/

/**
 * Find user by email (normalized)
 */
UserSchema.statics.findByEmail = function (email) {
  if (!email) return null;
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

module.exports = mongoose.model('User', UserSchema);
