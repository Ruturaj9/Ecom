// src/models/Product.js
const mongoose = require('mongoose');

/**
 * Product Schema
 *
 * - Core logic preserved exactly.
 * - Adds indexing for faster queries.
 * - Adds safe JSON transform (removes __v, normalizes id).
 * - Keeps schema clean and future-proof.
 */
const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },

    images: {
      type: [String],
      default: [],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
   Indexes (performance improvements)
------------------------------------------------------- */

// Fast search by title
ProductSchema.index({ title: 'text' });

// Useful for filtering & sorting
ProductSchema.index({ category: 1 });

// Querying by creation time
ProductSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);
