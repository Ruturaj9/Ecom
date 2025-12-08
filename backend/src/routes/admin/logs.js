// src/routes/admin/logs.js
const express = require('express');
const AuditLog = require('../../models/AuditLog');
const requireAdmin = require('../../middleware/requireAdmin');

const router = express.Router();

/**
 * GET /admin/logs?page=1&limit=15
 * Paginated Audit Logs
 *
 * - Default limit: 15
 * - Default page: 1
 * - Returns total count + total pages
 */
router.get('/', requireAdmin(['admin']), async (req, res, next) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;

    // Safety checks
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 15;

    const skip = (page - 1) * limit;

    // total logs count
    const total = await AuditLog.countDocuments();

    // paginated logs
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      logs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
