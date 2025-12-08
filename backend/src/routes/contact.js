// src/routes/contact.js
const express = require('express');
const { body } = require('express-validator');

const validateRequest = require('../middleware/validateRequest');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

/**
 * POST /contact
 * Save a contact form submission.
 *
 * - Main logic preserved.
 * - Strengthened validation & sanitization.
 * - Ensures consistent error handling.
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const msg = await ContactMessage.create(req.body);

      return res.status(201).json({
        message: 'Message received',
        data: msg,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
