'use strict';
/**
 * towers.js — REST API routes for Tower Heads configuration.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { logActivity } = require('../activityLogger');

const ok  = (res, data)        => res.json({ ok: true, data });
const err = (res, msg, status) => res.status(status || 500).json({ ok: false, error: msg });

function formatTower(r) {
  let heads = [];
  try { heads = JSON.parse(r.heads_json); } catch(_) {}
  return {
    id:         r.id,
    t:          r.tower_name,
    tower_key:  r.tower_key,
    tower_name: r.tower_name,
    scope:      r.scope,
    vert:       r.vertical,
    vertical:   r.vertical,
    heads:      heads,
    version:    r.version
  };
}

/* GET /api/towers */
router.get('/', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tower_config ORDER BY id').all();
    ok(res, rows.map(formatTower));
  } catch (e) {
    console.error('[towers] GET towers:', e.message);
    err(res, 'Failed to load tower configuration');
  }
});

/* PUT /api/towers/batch — update all towers */
router.put('/batch', (req, res) => {
  const { towers } = req.body;
  if (!Array.isArray(towers)) return err(res, 'towers array is required', 400);

  try {
    const prevRows = db.prepare('SELECT * FROM tower_config ORDER BY id').all().map(formatTower);
    const prevMap  = new Map(prevRows.map(r => [r.id, r]));

    const upd = db.prepare(`
      UPDATE tower_config SET
        scope = ?, vertical = ?, heads_json = ?, version = version + 1, updated_at = datetime('now')
      WHERE id = ?
    `);

    const updateAll = db.transaction((list) => {
      for (const t of list) {
        upd.run(
          (t.scope || '').trim(),
          (t.vertical || t.vert || '').trim(),
          JSON.stringify(t.heads || []),
          t.id
        );
      }
    });

    updateAll(towers);

    // Track added/removed heads and scope changes
    for (const t of towers) {
      const prev = prevMap.get(t.id);
      if (prev) {
        const prevHeads = prev.heads || [];
        const newHeads  = t.heads || [];

        // Detect removed heads
        for (const ph of prevHeads) {
          const stillExists = newHeads.some(nh => (nh.n || '').trim() === (ph.n || '').trim() && (nh.a || '').trim() === (ph.a || '').trim());
          if (!stillExists && ph.n) {
            logActivity({
              entity_type: 'tower_head',
              entity_id: t.id,
              entity_name: `${ph.n} (${t.tower_name || t.t || 'Tower ' + t.id})`,
              action: 'DELETE',
              summary: `Removed head "${ph.n}" (${ph.a || 'Tower-wide'}) from ${t.tower_name || t.t || 'Tower ' + t.id}`,
              details: {
                tower_id: t.id,
                tower_name: t.tower_name || t.t,
                head: ph,
                snapshot: { tower_id: t.id, tower_name: t.tower_name || t.t, head: ph }
              },
              is_deleted: 1
            });
          }
        }

        // Detect added heads
        for (const nh of newHeads) {
          const wasThere = prevHeads.some(ph => (ph.n || '').trim() === (nh.n || '').trim() && (ph.a || '').trim() === (nh.a || '').trim());
          if (!wasThere && nh.n) {
            logActivity({
              entity_type: 'tower_head',
              entity_id: t.id,
              entity_name: `${nh.n} (${t.tower_name || t.t || 'Tower ' + t.id})`,
              action: 'CREATE',
              summary: `Added head "${nh.n}" (${nh.a || 'Tower-wide'}) to ${t.tower_name || t.t || 'Tower ' + t.id}`,
              details: {
                tower_id: t.id,
                tower_name: t.tower_name || t.t,
                head: nh
              }
            });
          }
        }

        // Scope change
        if ((prev.scope || '').trim() !== (t.scope || '').trim()) {
          logActivity({
            entity_type: 'tower',
            entity_id: t.id,
            entity_name: t.tower_name || t.t || 'Tower ' + t.id,
            action: 'UPDATE',
            summary: `Updated business scope for ${t.tower_name || t.t || 'Tower ' + t.id}`,
            details: {
              changes: [{ field: 'Business scope', old: prev.scope, new: t.scope }]
            }
          });
        }
      }
    }

    const rows = db.prepare('SELECT * FROM tower_config ORDER BY id').all();
    ok(res, rows.map(formatTower));
  } catch (e) {
    console.error('[towers] PUT towers batch:', e.message);
    err(res, 'Failed to update towers');
  }
});

module.exports = router;
