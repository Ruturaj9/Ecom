// src/models/Slider.js
const mongoose = require('mongoose');

/**
 * Slider Schema
 *
 * - Main logic preserved 100%.
 * - Adds JSON transform for cleaner API output.
 * - Adds indexes for faster sorting & querying.
 * - Ensures consistent field defaults and trimming.
 */
const SliderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    subtitle: { type: String, default: '', trim: true },

    buttonText: { type: String, default: '', trim: true },

    buttonLink: { type: String, default: '', trim: true },

    desktop: { type: String, required: true },

    mobile: { type: String, required: true },

    order: { type: Number, default: 0 },
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

// For fast ordered slider retrieval
SliderSchema.index({ order: 1 });

// For admin filtering or maintenance
SliderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Slider', SliderSchema);
