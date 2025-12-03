const express = require('express');
const upload = require('../../middleware/uploadImages');
const requireAdmin = require('../../middleware/requireAdmin');
const auditLogger = require('../../middleware/auditLogger');

const router = express.Router();

/**
 * Upload one OR many images
 * POST /admin/products/upload
 */
router.post(
  '/',
  requireAdmin(['admin']),
  upload.array('images', 6), // ⭐ allows 1–6 images
  async (req, res, next) => {
    try {
      const urls = req.files.map(f => f.path); // Cloudinary URLs

      // Audit logging
      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'product.image.upload',
        resourceType: 'ProductImage',
        resourceId: null,
        before: null,
        after: { urls }
      });

      res.json({ urls });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
