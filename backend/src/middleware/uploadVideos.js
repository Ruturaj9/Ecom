// src/middleware/uploadVideos.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

/**
 * Cloudinary Video Storage
 * - Matches uploadImages.js structure
 * - Uses resource_type: 'video'
 * - Supports mp4 / webm / mov
 */
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'ecommerce_videos';

    if (req.originalUrl.includes('/admin/video-upload')) {
      folder = 'ecommerce_video_sliders';
    }

    return {
      folder,
      resource_type: 'video',
      allowed_formats: ['mp4', 'webm', 'mov'],
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    };
  },
});

/**
 * Multer instance (THIS is what .single() is called on)
 */
const uploadVideos = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

/**
 * Format Video Upload Response
 * - Single video only
 * - Returns desktop + mobile variants
 * - Thumbnail optional
 */
function formatVideoUploadResponse(file) {
  if (!file) return null;

  return {
    videoUrl: {
      desktop: file.path.replace('/upload/', '/upload/c_scale,w_1920/'),
      mobile: file.path.replace('/upload/', '/upload/c_scale,w_720/'),
    },
    thumbnail: file.path
      .replace('/upload/', '/upload/so_0,w_600/')
      .replace(/\.\w+$/, '.jpg'),
  };
}

/**
 * EXPORTS
 * - default export = multer instance (for .single)
 * - named helper preserved
 */
module.exports = uploadVideos;
module.exports.formatVideoUploadResponse = formatVideoUploadResponse;
