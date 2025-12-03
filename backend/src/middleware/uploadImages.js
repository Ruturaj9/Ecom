const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Storage configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecommerce_products',  // images folder in cloudinary
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp']
  }
});

const upload = multer({ storage });

module.exports = upload;
