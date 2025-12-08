// src/routes/slider.js
const express = require('express');
const Slider = require('../models/Slider');

const router = express.Router();

/**
 * GET /sliders
 * Public endpoint – returns active sliders sorted by order.
 *
 * - Main logic preserved exactly.
 * - Added consistent structure & error-safe response handling.
 */
router.get('/', async (req, res, next) => {
  try {
    const sliders = await Slider.find({ active: true })
      .sort({ order: 1 })
      .lean();

    return res.json({ sliders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
