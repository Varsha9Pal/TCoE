'use strict';
/**
 * activity.js — REST API routes for Change History & Recycle Bin.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { logActivity } = require('../activityLogger');

const ok  = (res, data)        => res.json({ ok: true, data });
const err = (res, msg, status) => res.status(status || 500).json({ ok: false, error: msg });

function formatLog(r) {
  let details = {};
  try { details = JSON.parse(r.details_json); } catch (_) {}
  return {
    id:          r.id,
    entity_type: r.entity_type,
    entity_id:   r.entity_id,
    entity_name: r.entity_name,
    action:      r.action,
    summary:     r.summary,
    details:     details,
    is_deleted:  Boolean(r.is_deleted),
    is_restored: Boolean(r.is_restored),
    created_at:  r.created_at
  };
}

/* GET /api/activity — Get activity history & trash count */
router.get('/', (req, res) => {
  const { type = 'all', entity } = req.query;

  try {
    const trashCountRow = db.prepare('SELECT COUNT(*) AS c FROM activity_log WHERE is_deleted = 1 AND is_restored = 0').get();
    const trashCount = trashCountRow ? trashCountRow.c : 0;

    let query = 'SELECT * FROM activity_log WHERE 1=1';
    const params = [];

    if (type === 'trash') {
      query += ' AND is_deleted = 1 AND is_restored = 0';
    }

    if (entity && entity !== 'all') {
      if (entity === 'tower') {
        query += " AND entity_type IN ('tower', 'tower_head')";
      } else {
        query += ' AND entity_type = ?';
        params.push(entity);
      }
    }

    query += ' ORDER BY id DESC LIMIT 150';

    const rows = db.prepare(query).all(...params);
    res.json({
      ok: true,
      data: rows.map(formatLog),
      trashCount
    });
  } catch (e) {
    console.error('[activity] GET error:', e.message);
    err(res, 'Failed to fetch activity logs');
  }
});

/* POST /api/activity/restore/:id — Restore a deleted item from trash */
router.post('/restore/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const log = db.prepare('SELECT * FROM activity_log WHERE id = ? AND is_deleted = 1 AND is_restored = 0').get(id);
    if (!log) return err(res, 'Item not found in trash or already restored', 404);

    let details = {};
    try { details = JSON.parse(log.details_json); } catch (_) {}
    const s = details.snapshot || details;

    if (log.entity_type === 'app') {
      db.prepare(`
        INSERT INTO app_list
          (tower, module, system_name, business_usage, app_type, technology, has_api, monthly_cr)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        s.Tower || s.tower || '',
        s.Module || s.module || '',
        s['System Name'] || s.system_name || log.entity_name,
        s['Business usage'] || s.business_usage || '',
        s['Application Type'] || s.app_type || '',
        s['Technology Used'] || s.technology || '',
        s['Has API'] || s.has_api || 'No',
        parseInt(s.monthly_cr || s['Approx. Monthly CR Count'] || s._cr || 0, 10) || 0
      );
    } else if (log.entity_type === 'team') {
      const maxSr = db.prepare('SELECT COALESCE(MAX(sr_no), 0) AS m FROM team_members').get().m;
      db.prepare(`
        INSERT INTO team_members
          (sr_no, resource_name, current_vendor, sdg_segment, sdg_vertical, vertical_head, location, system_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        maxSr + 1,
        s['Resource Name'] || s.resource_name || log.entity_name,
        s['Current Vendor'] || s.current_vendor || '',
        s['SDG Segment'] || s.sdg_segment || '',
        s['SDG Vertical'] || s.sdg_vertical || '',
        s['SDG Vertical Head'] || s.vertical_head || '',
        s.Location || s.location || '',
        s['System / Platform Name'] || s.system_name || ''
      );
    } else if (log.entity_type === 'tower_head') {
      const towerId = parseInt(s.tower_id || log.entity_id, 10);
      const targetHead = s.head || { n: log.entity_name, a: '' };
      const towerRow = db.prepare('SELECT * FROM tower_config WHERE id = ?').get(towerId);
      if (towerRow) {
        let heads = [];
        try { heads = JSON.parse(towerRow.heads_json); } catch (_) {}
        heads.push(targetHead);
        db.prepare("UPDATE tower_config SET heads_json = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?")
          .run(JSON.stringify(heads), towerId);
      }
    } else if (log.entity_type === 'prerequisite') {
      db.prepare(`
        INSERT INTO d1_prerequisites
          (sno, area, description, details, bank, qk, due, status, note, due_display, due_month, state, owner, ord, search_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        s.sno || 0,
        s.Area || s.area || '',
        JSON.stringify(s.Description || s.description || []),
        JSON.stringify(s.Details || s.details || []),
        JSON.stringify(s.Bank || s.bank || []),
        JSON.stringify(s.QK || s.qk || []),
        s.Due || s.due || '',
        s.Status || s.status || 'Not set',
        s.note || '',
        s.due_display || '',
        s.due_month || '',
        s.state || 'Not set',
        s.owner || '',
        s.ord || 0,
        s.search_text || ''
      );
    } else {
      return err(res, `Cannot restore unknown entity type: ${log.entity_type}`, 400);
    }

    // Mark as restored
    db.prepare('UPDATE activity_log SET is_restored = 1 WHERE id = ?').run(id);

    // Log the restore event
    logActivity({
      entity_type: log.entity_type,
      entity_id:   log.entity_id,
      entity_name: log.entity_name,
      action:      'RESTORE',
      summary:     `Restored ${log.entity_type}: ${log.entity_name}`,
      details:     { restored_from_log_id: id }
    });

    ok(res, { message: `Successfully restored ${log.entity_name}` });
  } catch (e) {
    console.error('[activity] Restore error:', e.message);
    err(res, 'Failed to restore item: ' + e.message);
  }
});

/* DELETE /api/activity/trash/:id — Permanently delete an item from trash */
router.delete('/trash/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = db.prepare('DELETE FROM activity_log WHERE id = ? AND is_deleted = 1').run(id);
    if (result.changes === 0) return err(res, 'Item not found in trash', 404);
    ok(res, { id, message: 'Permanently removed from trash' });
  } catch (e) {
    console.error('[activity] Permanent delete error:', e.message);
    err(res, 'Failed to delete from trash');
  }
});

/* DELETE /api/activity/clear — Clear activity history (keeps un-restored trash items) */
router.delete('/clear', (_req, res) => {
  try {
    db.prepare('DELETE FROM activity_log WHERE is_deleted = 0 OR is_restored = 1').run();
    ok(res, { message: 'Activity history cleared' });
  } catch (e) {
    console.error('[activity] Clear error:', e.message);
    err(res, 'Failed to clear activity history');
  }
});

module.exports = router;
