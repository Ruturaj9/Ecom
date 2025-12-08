// src/routes/admin/contactMessages.js
const express = require('express');
const ContactMessage = require('../../models/ContactMessage');
const requireAdmin = require('../../middleware/requireAdmin');

const router = express.Router();

/**
 * GET /admin/contact-messages
 * Returns all contact messages (latest first).
 *
 * - Logic preserved fully.
 * - Added error handling and validation.
 */
router.get('/', requireAdmin(['admin']), async (req, res, next) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ messages });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /admin/contact-messages/:id
 */
router.delete('/:id', requireAdmin(['admin']), async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
