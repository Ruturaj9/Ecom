const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
