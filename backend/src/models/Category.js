// src/models/Category.js
const mongoose = require('mongoose');

/**
 * Category Schema
 *
 * - Main logic preserved.
 * - Adds indexes for performance.
 * - Adds safe JSON transform (id formatting, removes __v).
 * - Sanitizes fields and ensures consistency.
 */
const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
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

// Unique name index (already enforced but explicitly defined)
CategorySchema.index({ name: 1 }, { unique: true });

// Useful for admin filtering or grouping
CategorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Category', CategorySchema);
