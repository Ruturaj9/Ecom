// src/models/Slider.js
const mongoose = require('mongoose');

/**
 * Slider Schema
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

    /** 🔥 Missing in your version — REQUIRED */
    active: { type: Boolean, default: true },

    /** 🔥 Missing in your version — REQUIRED */
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: false },
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

// Indexes
SliderSchema.index({ order: 1 });
SliderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Slider', SliderSchema);
