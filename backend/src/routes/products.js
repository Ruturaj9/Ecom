// src/routes/products.js
const express = require('express');
const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Category = require('../models/Category');
const { verifyAccessToken } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

/* ------------------------------------------------------
   Helpers
------------------------------------------------------- */

/** Parse positive integer query param */
function parsePositiveInt(val, fallback) {
  const n = parseInt(String(val || ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Escape regex special chars for safe regex usage */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Cloudinary transform helper (preserves logic)
 */
function transformCloudinaryUrl(url, { width = 400, quality = 'auto', format = 'auto' } = {}) {
  try {
    if (!url || typeof url !== 'string') return url;

    if (!url.includes('res.cloudinary.com') && !url.includes('/upload/')) return url;

    const insert = `upload/w_${width},q_${quality},f_${format}/`;

    return (
      url
        // replace exact upload folder
        .replace(/\/upload\/(?![a-zA-Z0-9_,])/g, `/${insert}`)
        // fallback (preserves original replacement behavior)
        .replace('/upload/', `/${insert}`)
    );
  } catch {
    return url;
  }
}

/** Format product for public API */
function preparePublicProduct(doc) {
  if (!doc) return doc;

  const out = { ...doc };
  out.images = Array.isArray(out.images) ? out.images : [];

  out.images = out.images.map((url) => transformCloudinaryUrl(url));

  return out;
}

/* ------------------------------------------------------
   Routes
------------------------------------------------------- */

/**
 * GET /products/categories
 * Public category list
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find()
      .select('_id name')
      .sort({ name: 1 })
      .lean();

    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /products
 * Querying + pagination + filtering + (optional) aggregation
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('q').optional().isString(),
    query('category').optional().isString(),
    query('sort').optional().isIn(['none', 'low-high', 'high-low']),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const page = parsePositiveInt(req.query.page, 1);
      const limit = parsePositiveInt(req.query.limit, 12);
      const q = req.query.q ? String(req.query.q).trim() : null;
      const category = req.query.category ? String(req.query.category).trim() : null;
      const sort = req.query.sort || 'none';

      const filter = {};
      let useAggregation = false;
      let aggPipeline = [];

      /* ------------------------------------------------------
         Title search
      ------------------------------------------------------- */
      if (q) {
        filter.title = { $regex: q, $options: 'i' };
      }

      /* ------------------------------------------------------
         Category filtering logic
      ------------------------------------------------------- */
      if (category) {
        const isObjectId = mongoose.Types.ObjectId.isValid(category);

        if (isObjectId) {
          filter.category = new mongoose.Types.ObjectId(category);
        } else {
          useAggregation = true;

          if (q) {
            aggPipeline.push({ $match: { title: { $regex: q, $options: 'i' } } });
          }

          // join categories
          aggPipeline.push({
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
            },
          });

          aggPipeline.push({
            $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
          });

          // match by category.name (preserved behavior)
          aggPipeline.push({
            $match: {
              'category.name': { $regex: `^${escapeRegExp(category)}$`, $options: 'i' },
            },
          });
        }
      }

      /* ------------------------------------------------------
         Aggregation Mode
      ------------------------------------------------------- */
      if (useAggregation) {
        const countPipeline = [...aggPipeline, { $count: 'total' }];
        const countResult = await Product.aggregate(countPipeline).exec();

        const total = countResult?.[0]?.total || 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const skip = (page - 1) * limit;

        // sorting
        let sortStage = {};
        if (sort === 'low-high') sortStage = { price: 1 };
        else if (sort === 'high-low') sortStage = { price: -1 };
        else sortStage = { createdAt: -1 };

        aggPipeline.push({ $sort: sortStage });
        aggPipeline.push({ $skip: skip });
        aggPipeline.push({ $limit: limit });

        aggPipeline.push({
          $project: {
            title: 1,
            description: 1,
            price: 1,
            images: 1,
            category: 1,
            createdBy: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        });

        const docs = await Product.aggregate(aggPipeline).exec();
        const products = docs.map((d) => preparePublicProduct(d));

        return res.json({ products, total, page, limit, totalPages });
      }

      /* ------------------------------------------------------
         Normal Query Mode
      ------------------------------------------------------- */
      const total = await Product.countDocuments(filter).exec();
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const skip = (page - 1) * limit;

      let cursor = Product.find(filter)
        .populate('category')
        .skip(skip)
        .limit(limit);

      if (sort === 'low-high') cursor = cursor.sort({ price: 1 });
      else if (sort === 'high-low') cursor = cursor.sort({ price: -1 });
      else cursor = cursor.sort({ createdAt: -1 });

      const list = await cursor.lean().exec();
      const products = list.map((d) => preparePublicProduct(d));

      res.json({ products, total, page, limit, totalPages });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /products/:id
 * Single product
 */
router.get(
  '/:id',
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate('category')
        .lean();

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product: preparePublicProduct(product) });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /products/:id/similar
 * Products from same category
 */
router.get(
  '/:id/similar',
  [
    param('id').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parsePositiveInt(req.query.limit, 4);
      const base = await Product.findById(req.params.id).lean();

      if (!base) return res.status(404).json({ error: 'Product not found' });
      if (!base.category) return res.json({ products: [] });

      const similar = await Product.find({
        _id: { $ne: base._id },
        category: base.category,
      })
        .limit(limit)
        .populate('category')
        .lean();

      const products = similar.map((d) => preparePublicProduct(d));

      res.json({ products });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /products
 * Create product (protected)
 */
router.post(
  '/',
  verifyAccessToken,
  [
    body('title').isString().notEmpty(),
    body('price').isNumeric(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { title, description, price } = req.body;

      const product = new Product({
        title,
        description,
        price,
        createdBy: req.user.id,
      });

      await product.save();

      res.status(201).json({ product });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
