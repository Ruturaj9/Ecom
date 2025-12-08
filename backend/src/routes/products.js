const express = require('express');
const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { verifyAccessToken } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

/**
 * Helper: parse positive integer query param
 */
function parsePositiveInt(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * GET /products
 * Query params:
 *  - page (default 1)
 *  - limit (default 12)
 *  - q (search in title, optional)
 *  - category (category id OR category name — optional)
 *  - sort ("low-high" | "high-low" | "none")
 *
 * Returns paginated { products, total, page, limit, totalPages }
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('q').optional().isString(),
    query('category').optional().isString(),
    query('sort').optional().isIn(['none', 'low-high', 'high-low'])
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const page = parsePositiveInt(req.query.page, 1);
      const limit = parsePositiveInt(req.query.limit, 12);
      const q = req.query.q ? String(req.query.q).trim() : null;
      const category = req.query.category ? String(req.query.category).trim() : null;
      const sort = req.query.sort ? String(req.query.sort) : 'none';

      // Base filter
      const filter = {};

      if (q) {
        // case-insensitive title search
        filter.title = { $regex: q, $options: 'i' };
      }

      // If category is provided and looks like ObjectId, match directly on category field
      let useAggregation = false;
      let aggPipeline = [];

      if (category) {
        const isObjectId = mongoose.Types.ObjectId.isValid(category);

        if (isObjectId) {
          filter.category = mongoose.Types.ObjectId(category);
        } else {
          // need to match by category.name -> use aggregation
          useAggregation = true;
          // We'll match title (if provided) later in pipeline
          aggPipeline.push({
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category'
            }
          });
          aggPipeline.push({ $unwind: { path: '$category', preserveNullAndEmptyArrays: true } });
          aggPipeline.push({
            $match: {
              'category.name': { $regex: `^${escapeRegExp(category)}$`, $options: 'i' }
            }
          });
        }
      }

      // If aggregation mode used (category by name), build pipeline with other filters & pagination
      if (useAggregation) {
        // If q present, add title regex match
        if (q) {
          aggPipeline.unshift({ $match: { title: { $regex: q, $options: 'i' } } });
        }

        // Count total
        const countPipeline = [...aggPipeline, { $count: 'total' }];

        const countResult = await Product.aggregate(countPipeline).exec();
        const total = (countResult[0] && countResult[0].total) ? countResult[0].total : 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const skip = (page - 1) * limit;

        // Sorting
        let sortStage = {};
        if (sort === 'low-high') sortStage = { price: 1 };
        else if (sort === 'high-low') sortStage = { price: -1 };
        else sortStage = { createdAt: -1 };

        // Final pipeline: add sort, skip, limit, then project/populate category as object
        aggPipeline.push({ $sort: sortStage });
        aggPipeline.push({ $skip: skip });
        aggPipeline.push({ $limit: limit });

        // Project to keep fields (category already joined)
        aggPipeline.push({
          $project: {
            title: 1,
            description: 1,
            price: 1,
            images: 1,
            category: 1,
            createdBy: 1,
            createdAt: 1,
            updatedAt: 1
          }
        });

        const docs = await Product.aggregate(aggPipeline).exec();

        // Return results
        return res.json({
          products: docs,
          total,
          page,
          limit,
          totalPages
        });
      }

      // Normal (non-aggregation) flow
      // Count total with filter
      const total = await Product.countDocuments(filter).exec();
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const skip = (page - 1) * limit;

      let qCursor = Product.find(filter)
        .populate('category')
        .skip(skip)
        .limit(limit);

      if (sort === 'low-high') qCursor = qCursor.sort({ price: 1 });
      else if (sort === 'high-low') qCursor = qCursor.sort({ price: -1 });
      else qCursor = qCursor.sort({ createdAt: -1 });

      const list = await qCursor.lean().exec();

      res.json({
        products: list,
        total,
        page,
        limit,
        totalPages
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /products/:id
 * Returns a single product by id (populated category)
 */
router.get(
  '/:id',
  [
    param('id').isMongoId()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const product = await Product.findById(id).populate('category').lean();
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json({ product });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /products/:id/similar
 * Return up to `limit` similar products by the same category
 * Query: ?limit=4
 */
router.get(
  '/:id/similar',
  [
    param('id').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const limit = parsePositiveInt(req.query.limit, 4);

      const base = await Product.findById(id).lean();
      if (!base) return res.status(404).json({ error: 'Product not found' });

      if (!base.category) {
        return res.json({ products: [] });
      }

      const similar = await Product.find({
        _id: { $ne: base._id },
        category: base.category
      })
        .limit(limit)
        .populate('category')
        .lean();

      res.json({ products: similar });
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
    body("title").isString().notEmpty(),
    body("price").isNumeric()
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

/**
 * Escape regex special characters in input used for regex generation.
 */
function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
