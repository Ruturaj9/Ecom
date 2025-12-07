const mongoose = require('mongoose');

const SliderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  buttonText: { type: String },
  buttonLink: { type: String },
  desktop: { type: String, required: true },
  mobile: { type: String, required: true },
  order: { type: Number, default: 0}
}, { timestamps: true });

module.exports = mongoose.model("Slider", SliderSchema);
