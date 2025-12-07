// src/routes/admin/productImages.js
const express = require('express');
const router = express.Router();

const { upload, formatUploadResponse } = require('../../middleware/uploadImages');

router.post('/images', upload.array('images', 6), (req, res) => {
  try {
    return res.json(formatUploadResponse(req, req.files));
  } catch (err) {
    console.error("PRODUCT IMAGES ERROR:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
