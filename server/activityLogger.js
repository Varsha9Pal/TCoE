'use strict';
/**
 * activityLogger.js — Central helper for tracking modifications and deleted snapshots.
 * Now async-compatible for Turso/libSQL.
 * Stores created_at in ISO 8601 UTC format (e.g. 2026-10-28T08:00:00.000Z)
 * so browsers convert correctly to the user's local timezone (IST).
 */
const db = require('./db');

async function logActivity({
  entity_type,
  entity_id,
  entity_name,
  action,
  summary,
  details = {},
  is_deleted = 0
}) {
  try {
    const isoNow = new Date().toISOString();
    await db.prepare(`
      INSERT INTO activity_log (
        entity_type, entity_id, entity_name, action, summary, details_json, is_deleted, is_restored, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      String(entity_type || 'system'),
      String(entity_id || ''),
      String(entity_name || ''),
      String(action || 'UPDATE').toUpperCase(),
      String(summary || ''),
      JSON.stringify(details || {}),
      is_deleted ? 1 : 0,
      isoNow
    );
  } catch (err) {
    console.error('[activityLogger] Error writing activity log:', err.message);
  }
}

module.exports = { logActivity };
