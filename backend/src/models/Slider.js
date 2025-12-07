// src/models/Slider.js
const mongoose = require('mongoose');

const SliderSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    buttonLink: { type: String, default: '' },

    /**
     * imageUrl was previously a String.
     * To support both legacy single-URL sliders and the new responsive uploads,
     * we allow either:
     *  - a string (legacy single Cloudinary URL)
     *  - an object { desktop: String, mobile: String }
     *
     * Use Schema.Types.Mixed so both shapes are accepted.
     */
    imageUrl: { type: mongoose.Schema.Types.Mixed, required: true },

    order: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Note: If you want to enforce two-variants in the future,
// replace Mixed with a dedicated subdocument { desktop: String, mobile: String }.

module.exports = mongoose.model('Slider', SliderSchema);
