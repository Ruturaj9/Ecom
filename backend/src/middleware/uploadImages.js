// src/middleware/uploadImages.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'ecommerce_general';

    if (req.originalUrl.includes('/slider/upload')) {
      folder = 'ecommerce_sliders';
    } 
    else if (req.originalUrl.includes('/upload/images')) {
      folder = 'ecommerce_products';
    }

    return {
      folder,
      allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    };
  }
});

const upload = multer({ storage });

function formatUploadResponse(req, files) {

  if (req.originalUrl.includes('/slider/upload')) {
    return {
      urls: files.map(f => ({
        desktop: f.path.replace('/upload/', '/upload/c_scale,w_1920/'),
        mobile: f.path.replace('/upload/', '/upload/c_scale,w_600/')
      }))
    };
  }

  return { urls: files.map(f => f.path) };
}

module.exports = {
  upload,
  formatUploadResponse
};
