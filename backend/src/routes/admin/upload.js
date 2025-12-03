const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const upload = require('../../middleware/uploadImages');
const auditLogger = require('../../middleware/auditLogger');

const router = express.Router();

// Upload single image
router.post(
  '/image',
  requireAdmin(['admin']),
  upload.single('image'),
  async (req, res, next) => {
    try {
      const imageUrl = req.file.path; // Cloudinary URL

      // audit log
      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'image.upload',
        resourceType: 'Image',
        resourceId: req.file.filename,
        before: null,
        after: { url: imageUrl }
      });

      res.json({ url: imageUrl });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
