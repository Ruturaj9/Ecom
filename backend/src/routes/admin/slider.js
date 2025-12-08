// src/routes/admin/slider.js
const express = require('express');
const { body, param } = require('express-validator');

const Slider = require('../../models/Slider');
const validateRequest = require('../../middleware/validateRequest');
const requireAdmin = require('../../middleware/requireAdmin');
const auditLogger = require('../../middleware/auditLogger');
const { upload, formatUploadResponse } = require('../../middleware/uploadImages');

const router = express.Router();

/* ------------------------------------------------------
   UPLOAD SLIDER IMAGES
   POST /admin/slider/upload
------------------------------------------------------- */
router.post(
  '/upload',
  requireAdmin(['admin']),
  upload.array('images', 10),
  async (req, res, next) => {
    try {
      const files = Array.isArray(req.files) ? req.files : [];

      if (files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      const result = formatUploadResponse(req, files);

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'slider.image.upload',
        resourceType: 'SliderImages',
        resourceId: null,
        before: null,
        after: result,
      });

      return res.json(result);
    } catch (err) {
      console.error('SLIDER UPLOAD ERROR:', err);
      next(err);
    }
  }
);

/* ------------------------------------------------------
   CREATE SLIDER ITEMS
   POST /admin/slider
------------------------------------------------------- */
router.post(
  '/',
  requireAdmin(['admin']),
  [
    body('sliders').isArray({ min: 1 }),
    body('sliders.*.desktop').notEmpty(),
    body('sliders.*.mobile').notEmpty(),
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
          desktop: s.desktop,
          mobile: s.mobile,
          order,
          active: s.active ?? true,
          createdBy: req.admin.id,
        });

        created.push(saved);
      }

      return res.status(201).json({ sliders: created });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   GET SLIDER LIST
   GET /admin/slider
------------------------------------------------------- */
router.get('/', requireAdmin(['admin']), async (req, res, next) => {
  try {
    const sliders = await Slider.find().sort({ order: 1 }).lean();
    return res.json({ sliders });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------
   UPDATE SLIDER
------------------------------------------------------- */
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

      return res.json({ slider: updated });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   DELETE SLIDER
------------------------------------------------------- */
router.delete(
  '/:id',
  requireAdmin(['admin']),
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      await Slider.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
