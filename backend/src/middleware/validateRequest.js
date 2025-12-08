// src/middleware/validateRequest.js
const { validationResult } = require('express-validator');

/**
 * validateRequest middleware
 *
 * - Core logic preserved.
 * - Ensures consistent error formatting.
 * - Prevents duplicate code blocks.
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array(),
    });
  }

  return next();
};
