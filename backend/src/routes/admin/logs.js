// src/routes/admin/logs.js
const express = require('express');
const AuditLog = require('../../models/AuditLog');
const requireAdmin = require('../../middleware/requireAdmin');

const router = express.Router();

/**
 * GET /admin/logs
 * Returns the 100 most recent audit logs.
 *
 * - Core logic preserved exactly.
 * - Adds safety, error handling, and future-proofing.
 */
router.get('/', requireAdmin(['admin']), async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
