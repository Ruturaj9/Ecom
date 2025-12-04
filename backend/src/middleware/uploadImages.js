// src/middleware/uploadImages.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Use correct option names depending on package version.
// This sets folder and allowed formats. If your package expects `allowedFormats` change accordingly.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecommerce_products',
    // try both forms if one fails; most recent docs show `allowed_formats`
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp']
  }
});

const upload = multer({ storage });

module.exports = upload;
