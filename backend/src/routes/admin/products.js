// src/routes/admin/products.js
const express = require('express');
const { body, param } = require('express-validator');
const Product = require('../../models/Product');
const validateRequest = require('../../middleware/validateRequest');
const requireAdmin = require('../../middleware/requireAdmin');
const auditLogger = require('../../middleware/auditLogger');
const upload = require('../../middleware/uploadImages');
const cloudinary = require('../../config/cloudinary');

const router = express.Router();

/**
 * Extract Cloudinary public ID
 */
function extractPublicId(url) {
  try {
    const regex = /\/upload\/(?:[^\/]+\/)*([^\/]+\/)?v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    if (!match) return null;

    const folder = match[1] || ""; 
    const file = match[2];
    return folder + file;
  } catch {
    return null;
  }
}

/**
 * Delete Cloudinary images
 */
async function deleteCloudinaryUrls(urls = []) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const tasks = urls.map(async (url) => {
    const publicId = extractPublicId(url);
    if (!publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
      console.log("🗑 Deleted:", publicId);
    } catch (err) {
      console.error("⚠ Delete failed:", publicId, err.message);
    }
  });

  await Promise.allSettled(tasks);
}

/**
 * CREATE PRODUCT
 * POST /admin/products
 */
router.post(
  '/',
  requireAdmin(['admin']),
  [
    body('title').isString().notEmpty(),
    body('price').isNumeric(),
    body('description').optional().isString(),
    body('images').optional().isArray(),
    body('images.*').optional().isURL()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { title, description, price, images = [] } = req.body;

      const product = await Product.create({
        title,
        description,
        price,
        images,
        createdBy: req.admin.id
      });

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'product.create',
        resourceType: 'Product',
        resourceId: product._id,
        before: null,
        after: product
      });

      res.status(201).json({ product });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET ALL PRODUCTS
 */
router.get('/', requireAdmin(['admin']), async (req, res, next) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ products });
  } catch (err) {
    next(err);
  }
});

/**
 * UPDATE PRODUCT
 */
router.put(
  '/:id',
  requireAdmin(['admin']),
  upload.array('newImages', 6),
  [
    param('id').isMongoId(),
    body('title').optional().isString(),
    body('price').optional().isNumeric(),
    body('description').optional().isString()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const before = await Product.findById(id).lean();
      if (!before) return res.status(404).json({ error: 'Product not found' });

      let existingImages = [];
      if (req.body.existingImages) {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch {
          return res.status(400).json({ error: 'existingImages must be JSON array' });
        }
      }

      const newUploadedImages = req.files.map((f) => f.path);
      const finalImages = [...existingImages, ...newUploadedImages];

      const updateData = {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        images: finalImages
      };

      const updated = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true });

      const removedImages = before.images.filter((img) => !finalImages.includes(img));
      await deleteCloudinaryUrls(removedImages);

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'product.update',
        resourceType: 'Product',
        resourceId: updated._id,
        before,
        after: updated
      });

      res.json({ product: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE PRODUCT
 */
router.delete(
  '/:id',
  requireAdmin(['admin']),
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const before = await Product.findById(id).lean();
      if (!before) return res.status(404).json({ error: 'Product not found' });

      await Product.findByIdAndDelete(id);

      await deleteCloudinaryUrls(before.images);

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'product.delete',
        resourceType: 'Product',
        resourceId: id,
        before,
        after: null
      });

      res.json({ message: 'Product deleted' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
