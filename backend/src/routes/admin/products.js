// src/routes/admin/products.js
const express = require('express');
const { body, param } = require('express-validator');

const Product = require('../../models/Product');
const validateRequest = require('../../middleware/validateRequest');
const requireAdmin = require('../../middleware/requireAdmin');
const auditLogger = require('../../middleware/auditLogger');
const { upload } = require('../../middleware/uploadImages');

const router = express.Router();

/* ------------------------------------------------------
   Helpers
------------------------------------------------------- */

/** Extract Cloudinary public ID */
function extractPublicId(url) {
  try {
    if (!url || typeof url !== 'string') return null;

    const regex = /\/upload\/(?:[^/]+\/)*([^/]+\/)?v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);

    if (!match) return null;

    const folder = match[1] || '';
    const file = match[2];

    return folder + file;
  } catch {
    return null;
  }
}

/** Delete Cloudinary images safely */
async function deleteCloudinaryUrls(urls = []) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const cloudinary = require('../../config/cloudinary');

  const tasks = urls.map(async (url) => {
    const publicId = extractPublicId(url);
    if (!publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
      console.log('🗑 Deleted:', publicId);
    } catch (err) {
      console.error('⚠ Failed delete:', publicId, err.message);
    }
  });

  await Promise.allSettled(tasks);
}

/* ------------------------------------------------------
   CREATE PRODUCT
------------------------------------------------------- */
router.post(
  '/',
  requireAdmin(['admin']),
  [
    body('title').isString().notEmpty(),
    body('price').isNumeric(),
    body('description').optional().isString(),
    body('images').optional().isArray(),
    body('category').optional().isMongoId(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { title, description, price, images = [], category = null } = req.body;

      const product = await Product.create({
        title,
        description,
        price,
        images,
        category,
        createdBy: req.admin.id,
      });

      return res.status(201).json({ product });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   GET PRODUCTS (PAGINATED)
------------------------------------------------------- */
router.get('/', requireAdmin(['admin']), async (req, res, next) => {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category')
        .lean(),

      Product.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      products,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------
   UPDATE PRODUCT
------------------------------------------------------- */
router.put(
  '/:id',
  requireAdmin(['admin']),
  upload.array('newImages', 6),
  [
    param('id').isMongoId(),
    body('title').optional().isString(),
    body('price').optional().isNumeric(),
    body('description').optional().isString(),
    body('category').optional().isMongoId(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const before = await Product.findById(id).lean();

      if (!before) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Parse existing images safely
      let existingImages = before.images;
      if (req.body.existingImages) {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch {
          existingImages = before.images;
        }
      }

      // Multer provides req.files as an array (safe fallback)
      const newImages = Array.isArray(req.files) ? req.files.map((f) => f.path) : [];

      const finalImages = [...existingImages, ...newImages];

      const updated = await Product.findByIdAndUpdate(
        id,
        {
          title: req.body.title ?? before.title,
          price: req.body.price ?? before.price,
          description: req.body.description ?? before.description,
          images: finalImages,
          category: req.body.category || before.category,
        },
        { new: true }
      );

      // Delete removed images
      const removed = before.images.filter((img) => !finalImages.includes(img));
      await deleteCloudinaryUrls(removed);

      return res.json({ product: updated });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   DELETE PRODUCT
------------------------------------------------------- */
router.delete(
  '/:id',
  requireAdmin(['admin']),
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const before = await Product.findById(id).lean();
      if (!before) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await Product.findByIdAndDelete(id);

      await deleteCloudinaryUrls(before.images);

      return res.json({ message: 'Product deleted' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
