// src/middleware/auditLogger.js
const AuditLog = require('../models/AuditLog');

/**
 * auditLogger
 *
 * - Main logic fully preserved.
 * - Standardized structure.
 * - Improved IP detection & fallbacks.
 * - Ensures logger never interrupts request flow.
 */
async function auditLogger({
  req,
  actorId,
  actorEmail,
  action,
  resourceType,
  resourceId,
  before,
  after,
}) {
  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.ip ||
      null;

    const userAgent = req.headers['user-agent'] || null;

    await AuditLog.create({
      actorId,
      actorEmail,
      action,
      resourceType,
      resourceId,
      before,
      after,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

module.exports = auditLogger;
