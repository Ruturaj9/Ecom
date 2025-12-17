// src/routes/videoSlider.js
const express = require('express');
const VideoSlider = require('../models/VideoSlider');

const router = express.Router();

/**
 * GET /videos
 * Public endpoint – returns only active video sliders sorted by order.
 * Output format matches frontend expectations.
 */
router.get('/', async (req, res, next) => {
  try {
    const videos = await VideoSlider.find({ active: true })
      .sort({ order: 1 })
      .lean();

    const formatted = videos.map(v => ({
      _id: v._id,
      title: v.title,
      subtitle: v.subtitle,
      order: v.order,

      // ✅ FIXED: correct field mapping
      videoUrl: {
        desktop: v.videoUrl?.desktop || '',
        mobile: v.videoUrl?.mobile || '',
      },

      thumbnail: v.thumbnail || '',
    }));

    return res.json({ videos: formatted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
