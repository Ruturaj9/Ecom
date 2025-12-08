// src/models/ContactMessage.js
const mongoose = require('mongoose');

/**
 * ContactMessage Schema
 *
 * - Core logic preserved.
 * - Adds trimming, defaults, and JSON transforms.
 * - Adds indexes for faster admin queries.
 */
const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, trim: true, lowercase: true },

    phone: { type: String, required: true, trim: true },

    message: { type: String, required: true, trim: true },
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
   Indexes
------------------------------------------------------- */

// Retrieve newest messages fast
ContactMessageSchema.index({ createdAt: -1 });

// Useful for searching by email
ContactMessageSchema.index({ email: 1 });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
