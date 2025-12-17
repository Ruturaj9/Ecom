const express = require('express');
const { body, param, query } = require('express-validator');

const VideoSlider = require('../../models/VideoSlider');
const validateRequest = require('../../middleware/validateRequest');
const requireAdmin = require('../../middleware/requireAdmin');
const auditLogger = require('../../middleware/auditLogger');
const uploadVideos = require('../../middleware/uploadVideos'); // ✅ ADDED

const router = express.Router();

/* ------------------------------------------------------
   VIDEO UPLOAD (SINGLE)
   POST /admin/video-upload
------------------------------------------------------- */
router.post(
  '/video-upload',
  requireAdmin(['admin']),
  uploadVideos.single('video'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video uploaded' });
      }

      return res.status(201).json({
        url: req.file.path,
        public_id: req.file.filename,
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   CREATE VIDEO SLIDERS (Bulk)
   POST /admin/video-sliders
------------------------------------------------------- */
router.post(
  '/',
  requireAdmin(['admin']),
  [
    body('videos').isArray({ min: 1 }),
    body('videos.*.desktop').notEmpty(),
    body('videos.*.mobile').notEmpty(),
    body('videos.*.title').optional().isString(),
    body('videos.*.subtitle').optional().isString(),
    body('videos.*.order').optional().isNumeric(),
    body('videos.*.active').optional().isBoolean(),
    body('videos.*.thumbnail').optional().isString(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { videos } = req.body;
      const created = [];

      let startOrder = await VideoSlider.countDocuments();

      for (const v of videos) {
        const saved = await VideoSlider.create({
          title: v.title || '',
          subtitle: v.subtitle || '',

          videoUrl: {
            desktop: v.desktop,
            mobile: v.mobile,
          },

          thumbnail: v.thumbnail || '',
          order: v.order || ++startOrder,
          active: v.active ?? true,
        });

        created.push(saved);
      }

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'videoSlider.create',
        resourceType: 'VideoSlider',
        resourceId: null,
        before: null,
        after: created,
      });

      return res.status(201).json({ videos: created });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   ADMIN GET LIST
------------------------------------------------------- */
router.get(
  '/',
  requireAdmin(['admin']),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const skip = (page - 1) * limit;

      const [videos, total] = await Promise.all([
        VideoSlider.find().sort({ order: 1 }).skip(skip).limit(limit).lean(),
        VideoSlider.countDocuments(),
      ]);

      const formatted = videos.map(v => ({
        _id: v._id,
        title: v.title,
        subtitle: v.subtitle,
        active: v.active,
        order: v.order,
        videoUrl: {
          desktop: v.videoUrl?.desktop || '',
          mobile: v.videoUrl?.mobile || '',
        },
        thumbnail: v.thumbnail || '',
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }));

      res.json({
        videos: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   UPDATE VIDEO SLIDER
------------------------------------------------------- */
router.put(
  '/:id',
  requireAdmin(['admin']),
  [
    param('id').isMongoId(),
    body('title').optional().isString(),
    body('subtitle').optional().isString(),
    body('desktop').optional().isString(),
    body('mobile').optional().isString(),
    body('order').optional().isNumeric(),
    body('active').optional().isBoolean(),
    body('thumbnail').optional().isString(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const update = {};

      if (req.body.title !== undefined) update.title = req.body.title;
      if (req.body.subtitle !== undefined) update.subtitle = req.body.subtitle;
      if (req.body.order !== undefined) update.order = req.body.order;
      if (req.body.active !== undefined) update.active = req.body.active;
      if (req.body.thumbnail !== undefined) update.thumbnail = req.body.thumbnail;

      if (req.body.desktop || req.body.mobile) {
        update.videoUrl = {};
        if (req.body.desktop) update.videoUrl.desktop = req.body.desktop;
        if (req.body.mobile) update.videoUrl.mobile = req.body.mobile;
      }

      const updated = await VideoSlider.findByIdAndUpdate(
        req.params.id,
        { $set: update },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: 'Video slider not found' });
      }

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'videoSlider.update',
        resourceType: 'VideoSlider',
        resourceId: updated._id.toString(),
        before: null,
        after: updated,
      });

      res.json({ video: updated });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   DELETE VIDEO SLIDER
------------------------------------------------------- */
router.delete(
  '/:id',
  requireAdmin(['admin']),
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const deleted = await VideoSlider.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Video slider not found' });
      }

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'videoSlider.delete',
        resourceType: 'VideoSlider',
        resourceId: deleted._id.toString(),
        before: deleted,
        after: null,
      });

      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
