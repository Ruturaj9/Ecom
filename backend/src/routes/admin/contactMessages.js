const express = require('express');
const ContactMessage = require('../../models/ContactMessage');
const requireAdmin = require('../../middleware/requireAdmin');
const router = express.Router();

router.get('/', requireAdmin(['admin']), async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
  res.json({ messages });
});

router.delete('/:id', requireAdmin(['admin']), async (req, res) => {
  await ContactMessage.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
