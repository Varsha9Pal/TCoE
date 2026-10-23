'use strict';
/**
 * activityLogger.js — Central helper for tracking modifications and deleted snapshots.
 */
const db = require('./db');

function logActivity({
  entity_type,
  entity_id,
  entity_name,
  action,
  summary,
  details = {},
  is_deleted = 0
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO activity_log (
        entity_type, entity_id, entity_name, action, summary, details_json, is_deleted, is_restored
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);
    stmt.run(
      String(entity_type || 'system'),
      String(entity_id || ''),
      String(entity_name || ''),
      String(action || 'UPDATE').toUpperCase(),
      String(summary || ''),
      JSON.stringify(details || {}),
      is_deleted ? 1 : 0
    );
  } catch (err) {
    console.error('[activityLogger] Error writing activity log:', err.message);
  }
}

module.exports = { logActivity };
