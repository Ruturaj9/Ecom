// src/utils/toMs.js
/**
 * Convert a duration string into milliseconds.
 *
 * Supported formats:
 *  - "15m"  → minutes
 *  - "2h"   → hours
 *  - "7d"   → days
 *  - "1000" → raw ms
 *
 * - Core logic preserved exactly.
 * - Adds safety checks & trimming.
 * - Handles unexpected input cleanly.
 */
function toMs(str) {
  if (!str || typeof str !== 'string') {
    return 0;
  }

  const clean = str.trim();
  const num = parseInt(clean, 10);

  if (Number.isNaN(num)) {
    return 0;
  }

  if (clean.endsWith('m')) return num * 60 * 1000;
  if (clean.endsWith('h')) return num * 60 * 60 * 1000;
  if (clean.endsWith('d')) return num * 24 * 60 * 60 * 1000;

  return num;
}

module.exports = { toMs };
