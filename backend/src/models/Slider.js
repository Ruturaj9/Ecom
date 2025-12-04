// src/models/Slider.js
const mongoose = require('mongoose');

const SliderSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  buttonText: { type: String, default: '' },
  buttonLink: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  order: { type: Number, default: 0, index: true },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-increment order if not provided on create (handled in route for clarity)
module.exports = mongoose.model('Slider', SliderSchema);
