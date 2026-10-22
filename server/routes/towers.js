'use strict';
/**
 * towers.js — REST API routes for Tower Heads configuration.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');

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
    const rows = db.prepare('SELECT * FROM tower_config ORDER BY id').all();
    ok(res, rows.map(formatTower));
  } catch (e) {
    console.error('[towers] PUT towers batch:', e.message);
    err(res, 'Failed to update towers');
  }
});

module.exports = router;
