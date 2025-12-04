const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorEmail: { type: String, required: true },

  action: { type: String, required: true }, 
  // examples: "product.create", "product.update", "product.delete"

  resourceType: { type: String, required: true }, 
  // example: "Product", "ProductImage"

  // resourceId is now OPTIONAL for standalone events (image upload, login attempts, etc.)
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null, required: false },

  before: { type: Object },  // previous data
  after: { type: Object },   // new data

  ip: { type: String },
  userAgent: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
