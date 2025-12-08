// src/middleware/errorHandler.js

/**
 * Global Error Handler
 *
 * - Preserves your existing logic fully.
 * - Adds safer formatting, avoids leaking internal details,
 *   improves structure, and keeps consistency across API responses.
 * - Prevents double responses when headers were already sent.
 */

module.exports = (err, req, res, next) => {
  try {
    // Log full error for server diagnostics
    console.error('🔥 [ErrorHandler]', err);

    // If headers already sent, delegate to Express default handler
    if (res.headersSent) {
      return next(err);
    }

    // Standardized status code (default: 500)
    const statusCode = err.status || err.statusCode || 500;

    // Prevent exposing internal stack traces in production
    const message =
      typeof err.message === 'string' && err.message.trim()
        ? err.message
        : 'Internal server error';

    // Optional error code for client logic
    const errorCode = err.code || 'SERVER_ERROR';

    // Safe error response
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: errorCode,
      },
    });
  } catch (handlerErr) {
    // Fallback: unexpected error inside the handler
    console.error('🔥 [ErrorHandler] Unexpected failure:', handlerErr);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: { message: 'Unexpected server error', code: 'SERVER_FAILURE' },
      });
    }
  }
};
