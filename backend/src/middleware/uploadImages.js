// src/middleware/uploadImages.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

/**
 * Cloudinary Storage Configuration
 * - Main logic preserved.
 * - Cleaned condition checks.
 * - Ensures consistent folder mapping.
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'ecommerce_general';

    const url = req.originalUrl || '';

    if (url.includes('/slider/upload')) {
      folder = 'ecommerce_sliders';
    } else if (url.includes('/upload/images')) {
      folder = 'ecommerce_products';
    }

    return {
      folder,
      allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    };
  },
});

const upload = multer({ storage });

/**
 * Format Upload Response
 *
 * - Keeps main logic exactly the same.
 * - Safe handling of non-array files.
 */
function formatUploadResponse(req, files) {
  const fileList = Array.isArray(files) ? files : [];

  // Slider uploads return mobile + desktop variations
  if (req.originalUrl.includes('/slider/upload')) {
    return {
      urls: fileList.map((f) => ({
        desktop: f.path.replace('/upload/', '/upload/c_scale,w_1920/'),
        mobile: f.path.replace('/upload/', '/upload/c_scale,w_600/'),
      })),
    };
  }

  // Product or general uploads
  return {
    urls: fileList.map((f) => f.path),
  };
}

module.exports = {
  upload,
  formatUploadResponse,
};
