// src/routes/slider.js
const express = require('express');
const Slider = require('../models/Slider');

const router = express.Router();

/**
 * GET /sliders
 * Public endpoint – returns only active sliders sorted by order.
 * Output format matches frontend expectations:
 *
 * {
 *   sliders: [
 *     {
 *       title,
 *       subtitle,
 *       buttonText,
 *       buttonLink,
 *       order,
 *       imageUrl: {
 *         desktop,
 *         mobile
 *       }
 *     }
 *   ]
 * }
 */
router.get('/', async (req, res, next) => {
  try {
    const sliders = await Slider.find({ active: true })
      .sort({ order: 1 })
      .lean();

    const formatted = sliders.map(s => ({
      title: s.title,
      subtitle: s.subtitle,
      buttonText: s.buttonText,
      buttonLink: s.buttonLink,
      order: s.order,

      imageUrl: {
        desktop: s.desktop,
        mobile: s.mobile
      }
    }));

    return res.json({ sliders: formatted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
