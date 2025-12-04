const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const upload = require('../../middleware/uploadImages');
const auditLogger = require('../../middleware/auditLogger');

const router = express.Router();

// Upload multiple images
router.post(
  '/images',
  requireAdmin(['admin']),
  upload.array('images', 10), // allow up to 10 images
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      const urls = req.files.map((file) => file.path); // Cloudinary-generated URLs

      // audit log each image
      for (const file of req.files) {
        await auditLogger({
          req,
          actorId: req.admin.id,
          actorEmail: req.admin.email,
          action: 'image.upload',
          resourceType: 'Image',
          resourceId: file.filename,
          before: null,
          after: { url: file.path }
        });
      }

      res.json({ urls });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
