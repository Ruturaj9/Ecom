const express = require('express');
const Product = require('../../models/Product');
const Slider = require('../../models/Slider');
const User = require('../../models/User');  // if you have user model
const requireAdmin = require('../../middleware/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin(['admin']), async (req, res) => {
  try {
    const [products, sliders, users] = await Promise.all([
      Product.countDocuments(),
      Slider.countDocuments(),
      User.countDocuments()
    ]);

    res.json({
      products,
      sliders,
      users
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

module.exports = router;
