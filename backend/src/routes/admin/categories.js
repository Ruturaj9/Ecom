// src/routes/admin/categories.js
const express = require('express');
const { body, param } = require('express-validator');

const Category = require('../../models/Category');
const validateRequest = require('../../middleware/validateRequest');
const requireAdmin = require('../../middleware/requireAdmin');
const auditLogger = require('../../middleware/auditLogger');

const router = express.Router();

/* ------------------------------------------------------
   CREATE CATEGORY
   POST /admin/categories
------------------------------------------------------- */
router.post(
  '/',
  requireAdmin(['admin']),
  [
    body('name').isString().notEmpty(),
    body('description').optional().isString(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, description } = req.body;

      const category = await Category.create({
        name,
        description,
        createdBy: req.admin.id,
      });

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'category.create',
        resourceType: 'Category',
        resourceId: category._id,
        before: null,
        after: category,
      });

      return res.status(201).json({ category });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Category already exists' });
      }
      next(err);
    }
  }
);

/* ------------------------------------------------------
   GET ALL CATEGORIES
------------------------------------------------------- */
router.get('/', requireAdmin(['admin']), async (req, res, next) => {
  try {
    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ categories });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------
   UPDATE CATEGORY
   PUT /admin/categories/:id
------------------------------------------------------- */
router.put(
  '/:id',
  requireAdmin(['admin']),
  [
    param('id').isMongoId(),
    body('name').optional().isString(),
    body('description').optional().isString(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const before = await Category.findById(id).lean();
      if (!before) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const updated = await Category.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      );

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'category.update',
        resourceType: 'Category',
        resourceId: id,
        before,
        after: updated,
      });

      return res.json({ category: updated });
    } catch (err) {
      next(err);
    }
  }
);

/* ------------------------------------------------------
   DELETE CATEGORY
------------------------------------------------------- */
router.delete(
  '/:id',
  requireAdmin(['admin']),
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const before = await Category.findById(id).lean();
      if (!before) {
        return res.status(404).json({ error: 'Category not found' });
      }

      await Category.findByIdAndDelete(id);

      await auditLogger({
        req,
        actorId: req.admin.id,
        actorEmail: req.admin.email,
        action: 'category.delete',
        resourceType: 'Category',
        resourceId: id,
        before,
        after: null,
      });

      return res.json({ message: 'Category deleted' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
