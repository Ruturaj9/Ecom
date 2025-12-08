// src/models/AuditLog.js
const mongoose = require('mongoose');

/**
 * AuditLog Schema
 *
 * - Core logic preserved.
 * - Adds trimming/normalization.
 * - Adds indexing for faster admin browsing.
 * - Adds safe JSON transform (id cleanup, remove __v).
 */
const AuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    actorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    resourceType: {
      type: String,
      required: true,
      trim: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    before: { type: Object, default: null },

    after: { type: Object, default: null },

    ip: { type: String, default: null },

    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ------------------------------------------------------
   Indexes (for admin dashboard performance)
------------------------------------------------------- */

// Admin dashboards often filter logs by newest first
AuditLogSchema.index({ createdAt: -1 });

// Fast lookups by user
AuditLogSchema.index({ actorId: 1 });

// Fast filtering by event type
AuditLogSchema.index({ action: 1 });

// Optional filtering by resource
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
