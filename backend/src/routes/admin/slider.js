// src/routes/admin/slider.js
const express = require('express');
const { body, param } = require('express-validator');
const Slider = require('../../models/Slider');
const validateRequest = require('../../middleware/validateRequest');
const requireAdmin = require('../../middleware/requireAdmin');
const auditLogger = require('../../middleware/auditLogger');
const upload = require('../../middleware/uploadImages');
const cloudinary = require('../../config/cloudinary');

const router = express.Router();

/**
 * Upload slider images (memoryStorage → Cloudinary upload)
 * Returns:
 *  { urls: [ { desktop: <url>, mobile: <url> }, ... ] }
 */
router.post(
  '/upload',
  requireAdmin(['admin']),
  upload.array('images', 10),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      const uploadResults = [];

      for (const file of req.files) {
        if (!file.buffer) {
          console.warn("Skipping file without buffer", file);
          continue;
        }

        // Upload DESKTOP VERSION
        const desktopPromise = cloudinary.uploader.upload_stream({
          folder: 'ecommerce_sliders',
          width: 1600,
          height: 600,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          fetch_format: 'auto'
        });

        // Upload MOBILE VERSION
        const mobilePromise = cloudinary.uploader.upload_stream({
          folder: 'ecommerce_sliders',
          width: 800,
          height: 350,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          fetch_format: 'auto'
        });

        // Convert upload_stream to promise
        const streamUpload = (stream, buffer) =>
          new Promise((resolve, reject) => {
            const cldStream = stream;
            cldStream.on('finish', resolve);
            cldStream.on('error', reject);
            cldStream.end(buffer);
          });

        const desktopRes = await new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder: 'ecommerce_sliders',
              width: 1600,
              height: 600,
              crop: 'fill',
              gravity: 'auto',
              quality: 'auto',
              fetch_format: 'auto'
            },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          upload.end(file.buffer);
        });

        const mobileRes = await new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder: 'ecommerce_sliders',
              width: 800,
              height: 350,
              crop: 'fill',
              gravity: 'auto',
              quality: 'auto',
              fetch_format: 'auto'
            },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          upload.end(file.buffer);
        });

        uploadResults.push({
          desktop: desktopRes.secure_url,
          mobile: mobileRes.secure_url
        });
      }

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'slider.image.upload',
        resourceType: 'SliderImage',
        resourceId: null,
        before: null,
        after: { urls: uploadResults }
      });

      res.json({ urls: uploadResults });

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      next(err);
    }
  }
);

/**
 * Save slider items
 */
router.post(
  '/',
  requireAdmin(['admin']),
  [
    body('sliders').isArray({ min: 1 }),
    body('sliders.*.imageUrl').notEmpty(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { sliders } = req.body;
      const created = [];

      for (const s of sliders) {
        const order = s.order || (await Slider.countDocuments()) + 1;

        const saved = await Slider.create({
          title: s.title || '',
          subtitle: s.subtitle || '',
          buttonText: s.buttonText || '',
          buttonLink: s.buttonLink || '',
          imageUrl: s.imageUrl,
          order,
          active: s.active ?? true,
          createdBy: req.admin.id
        });

        created.push(saved);
      }

      res.status(201).json({ sliders: created });

    } catch (err) {
      next(err);
    }
  }
);

/**
 * Admin list sliders
 */
router.get('/', requireAdmin(['admin']), async (req, res) => {
  const list = await Slider.find().sort({ order: 1 }).lean();
  res.json({ sliders: list });
});

/**
 * Update slider
 */
router.put(
  '/:id',
  requireAdmin(['admin']),
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const updated = await Slider.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      res.json({ slider: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Delete slider
 */
router.delete(
  '/:id',
  requireAdmin(['admin']),
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      await Slider.findByIdAndDelete(req.params.id);
      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
