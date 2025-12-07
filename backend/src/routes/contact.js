// src/routes/contact.js
const express = require('express');
const { body } = require('express-validator');

const validateRequest = require('../middleware/validateRequest');  // FIXED
const ContactMessage = require('../models/ContactMessage');        // FIXED PATH

const router = express.Router();

/**
 * POST /contact
 * Save a contact form submission
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const msg = await ContactMessage.create(req.body);
      res.status(201).json({ message: 'Message received', data: msg });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
