// src/middleware/uploadImages.js
const multer = require('multer');

const storage = multer.memoryStorage(); // <-- FIXED

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = upload;
