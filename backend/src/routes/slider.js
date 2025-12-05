// src/routes/slider.js
const express = require('express');
const Slider = require('../models/Slider');

const router = express.Router();

// GET /sliders (public)
router.get('/', async (req, res, next) => {
  try {
    const sliders = await Slider.find({ active: true })
      .sort({ order: 1 })
      .lean();

    res.json({ sliders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
