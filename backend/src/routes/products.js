const express = require('express');
const { body } = require('express-validator');
const Product = require('../models/Product');
const { verifyAccessToken } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find().limit(50).lean();
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  verifyAccessToken,
  [
    body('title').isString().notEmpty(),
    body('price').isNumeric()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { title, description, price } = req.body;
      const product = new Product({
        title,
        description,
        price,
        createdBy: req.user.id
      });
      await product.save();
      res.status(201).json({ product });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
