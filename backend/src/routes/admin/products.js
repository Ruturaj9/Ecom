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
 * Extract Cloudinary public ID (robust, production-safe)
 */
function extractPublicId(url) {
  try {
    // Matches patterns including transformations and nested folders:
    // /upload/.../v12345/folder/name.jpg
    const regex = /\/upload\/(?:[^\/]+\/)*([^\/]+\/)?v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);

    if (!match) return null;

    const folder = match[1] || "";  // folder/
    const file = match[2];          // name

    return folder + file;           // folder/name
  } catch (err) {
    return null;
  }
}

/**
 * Delete Cloudinary images in parallel (fast, safe)
 */
async function deleteCloudinaryUrls(urls = []) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const tasks = urls.map(async (url) => {
    const publicId = extractPublicId(url);
    if (!publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
      console.log("🗑 Cloudinary deleted:", publicId);
    } catch (err) {
      console.error("⚠ Cloudinary delete failed:", publicId, err.message);
    }
  });

  await Promise.allSettled(tasks);
}

/**
 * ADMIN: CREATE PRODUCT
 * POST /admin/products
 */
router.post(
  '/',
  requireAdmin(['admin']),
  upload.array('images', 6),
  [
    body('title').isString().notEmpty(),
    body('price').isNumeric(),
    body('description').optional().isString(),
    body('images').optional().isArray(),
    body('images.*').optional().isString().isURL()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { title, description, price } = req.body;

      const uploadedImages = req.files?.map((f) => f.path) || [];
      const providedImages = Array.isArray(req.body.images) ? req.body.images : [];

      const finalImages = uploadedImages.length > 0 ? uploadedImages : providedImages;

      const product = await Product.create({
        title,
        description,
        price,
        images: finalImages,
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
 * ADMIN: GET ALL PRODUCTS
 * GET /admin/products
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
 * ADMIN: UPDATE PRODUCT (Add / Remove / Replace Images)
 * PUT /admin/products/:id
 *
 * Body (form-data):
 *    existingImages: JSON array of images to KEEP
 *    newImages: uploaded files
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

      // Parse existingImages JSON
      let existingImages = [];
      if (req.body.existingImages) {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch {
          return res.status(400).json({ error: 'existingImages must be JSON array' });
        }
      }

      const newUploadedImages = req.files.map((f) => f.path);

      // Final image list
      const finalImages = [...existingImages, ...newUploadedImages];

      const updateData = {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        images: finalImages
      };

      const updated = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true });

      // Remove old images that were not kept
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
 * ADMIN: DELETE PRODUCT (with Cloudinary cleanup)
 * DELETE /admin/products/:id
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

      // Delete product doc
      await Product.findByIdAndDelete(id);

      // Delete images
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
