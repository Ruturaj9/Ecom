// src/routes/admin/slider.js
const express = require('express');
const { body, param } = require('express-validator');
const Slider = require('../../models/Slider');
const validateRequest = require('../../middleware/validateRequest');
const requireAdmin = require('../../middleware/requireAdmin');
const auditLogger = require('../../middleware/auditLogger');
const upload = require('../../middleware/uploadImages');

const router = express.Router();

/**
 * Upload slider images
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

      const urls = req.files.map((f) => f.path);

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'slider.image.upload',
        resourceType: 'SliderImage',
        resourceId: null,
        before: null,
        after: { urls },
      });

      res.json({ urls });
    } catch (err) {
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
    body('sliders.*.imageUrl').isString().notEmpty(),
    body('sliders.*.title').optional().isString(),
    body('sliders.*.subtitle').optional().isString(),
    body('sliders.*.buttonText').optional().isString(),
    body('sliders.*.buttonLink').optional().isString(),
    body('sliders.*.order').optional().isInt(),
    body('sliders.*.active').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { sliders } = req.body;
      const created = [];

      for (const s of sliders) {
        const order =
          s.order ||
          (await Slider.countDocuments()) + 1;

        const doc = {
          title: s.title || '',
          subtitle: s.subtitle || '',
          buttonText: s.buttonText || '',
          buttonLink: s.buttonLink || '',
          imageUrl: s.imageUrl,
          order,
          active: s.active ?? true,
          createdBy: req.admin.id,
        };

        const saved = await Slider.create(doc);

        await auditLogger({
          req,
          actorId: req.admin.id,
          actorEmail: req.admin.email,
          action: 'slider.create',
          resourceType: 'Slider',
          resourceId: saved._id,
          before: null,
          after: saved,
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
 * List sliders (admin)
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
  [
    param('id').isMongoId(),
    body('title').optional().isString(),
    body('subtitle').optional().isString(),
    body('buttonText').optional().isString(),
    body('buttonLink').optional().isString(),
    body('imageUrl').optional().isURL(),
    body('order').optional().isInt(),
    body('active').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const before = await Slider.findById(req.params.id).lean();
      if (!before) return res.status(404).json({ error: 'Not found' });

      const updated = await Slider.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'slider.update',
        resourceType: 'Slider',
        resourceId: updated._id,
        before,
        after: updated,
      });

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
      const before = await Slider.findById(req.params.id).lean();
      if (!before) return res.status(404).json({ error: 'Not found' });

      await Slider.findByIdAndDelete(req.params.id);

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'slider.delete',
        resourceType: 'Slider',
        resourceId: req.params.id,
        before,
        after: null,
      });

      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
