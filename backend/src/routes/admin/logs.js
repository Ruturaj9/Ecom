const express = require('express');
const AuditLog = require('../../models/AuditLog');
const requireAdmin = require('../../middleware/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin(['admin']), async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ logs });
});

module.exports = router;
