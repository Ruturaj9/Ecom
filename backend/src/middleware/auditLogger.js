const AuditLog = require('../models/AuditLog');

async function auditLogger({
  req,
  actorId,
  actorEmail,
  action,
  resourceType,
  resourceId,
  before,
  after
}) {
  try {
    await AuditLog.create({
      actorId,
      actorEmail,
      action,
      resourceType,
      resourceId,
      before,
      after,
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

module.exports = auditLogger;
