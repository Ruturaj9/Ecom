// src/routes/admin/upload.js
const express = require('express');
const router = express.Router();

const { upload, formatUploadResponse } = require('../../middleware/uploadImages');

// POST /admin/upload/images
router.post('/images', upload.array('images', 10), (req, res) => {
  try {
    return res.json(formatUploadResponse(req, req.files));
  } catch (err) {
    console.error("UPLOAD ROUTE ERROR:", err);
    return res.status(500).json({ error: "Cloudinary upload failed" });
  }
});

module.exports = router;
