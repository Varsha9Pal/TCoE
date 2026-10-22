'use strict';
/**
 * day1.js — REST API routes for Day 1 Readiness.
 * Uses better-sqlite3 with optimistic concurrency locking and full prototype compatibility.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ── helpers ─────────────────────────────────────────────────── */
const ok  = (res, data)        => res.json({ ok: true, data });
const err = (res, msg, status) => res.status(status || 500).json({ ok: false, error: msg });

function parseJson(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try {
    const p = JSON.parse(str);
    return Array.isArray(p) ? p : [String(p)];
  } catch (_) {
    return str.split('\n').map(s => s.trim()).filter(Boolean);
  }
}

function computeMeta(area, desc, det, bnk, qkArr, dueVal, statusVal, noteVal) {
  const status = statusVal || 'Not set';
  const due    = (dueVal || '').trim();

  // 1. _state
  let state = status;
  if (status === 'Planned') {
    if (due && due !== 'TBD') {
      const d = new Date(due + 'T00:00:00Z');
      if (!isNaN(d) && d < new Date('2026-10-22T00:00:00Z')) {
        state = 'Overdue';
      }
    }
  }

  // 2. _month
  let month = 'Not dated';
  if (due && due !== 'TBD') {
    const d = new Date(due + 'T00:00:00Z');
    if (!isNaN(d)) {
      month = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    }
  }

  // 3. _due (display)
  let dueDisplay = due || '—';
  if (due === 'TBD') {
    dueDisplay = 'TBD';
  } else if (due) {
    const d = new Date(due + 'T00:00:00Z');
    if (!isNaN(d)) {
      dueDisplay = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    }
  }

  // 4. _owner
  let owner = 'Joint / unassigned';
  if (bnk.length && qkArr.length) owner = 'Bank + QK';
  else if (bnk.length) owner = 'Bank';
  else if (qkArr.length) owner = 'QK';

  // 5. _search
  const search = [
    area,
    ...desc,
    ...det,
    ...bnk,
    ...qkArr,
    state,
    dueDisplay,
    owner
  ].join(' ').toLowerCase();

  // 6. _ord
  let ord = 10000000;
  if (due && due !== 'TBD') {
    const d = new Date(due + 'T00:00:00Z');
    if (!isNaN(d)) ord = Math.floor(d.getTime() / 86400000);
  }

  return { state, month, dueDisplay, owner, search, ord };
}

function formatRow(r) {
  const desc = parseJson(r.description);
  const det  = parseJson(r.details);
  const bnk  = parseJson(r.bank);
  const qkArr= parseJson(r.qk);

  return {
    id:          r.id,
    sno:         r.sno,
    Area:        r.area,
    area:        r.area,
    Description: desc,
    description: desc,
    Details:     det,
    details:     det,
    Bank:        bnk,
    bank:        bnk,
    QK:          qkArr,
    qk:          qkArr,
    Due:         r.due,
    due:         r.due,
    due_date:    r.due,
    Status:      r.status,
    status:      r.status,
    note:        r.note || '',
    Note:        r.note || '',
    _due:        r.due_display,
    due_display: r.due_display,
    _month:      r.due_month,
    due_month:   r.due_month,
    _state:      r.state,
    state:       r.state,
    _owner:      r.owner,
    owner:       r.owner,
    _ord:        r.ord,
    _search:     r.search_text,
    version:     r.version
  };
}

/* ═══════════════════════════════════════════════════════════════
   PREREQUISITES
═══════════════════════════════════════════════════════════════ */

/* GET /api/day1/prerequisites */
router.get('/prerequisites', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM d1_prerequisites ORDER BY sno, id').all();
    ok(res, rows.map(formatRow));
  } catch (e) {
    console.error('[day1] GET prerequisites:', e.message);
    err(res, 'Failed to load prerequisites');
  }
});

/* POST /api/day1/prerequisites */
router.post('/prerequisites', (req, res) => {
  const area = (req.body.area || req.body.Area || '').trim();
  const desc = Array.isArray(req.body.description) ? req.body.description : parseJson(req.body.description);
  const det  = Array.isArray(req.body.details)     ? req.body.details     : parseJson(req.body.details);
  const bnk  = Array.isArray(req.body.bank)        ? req.body.bank        : parseJson(req.body.bank);
  const qkArr= Array.isArray(req.body.qk)          ? req.body.qk          : parseJson(req.body.qk);
  const due  = (req.body.due || req.body.due_date || '').trim();
  const status = req.body.status || req.body.state || req.body.Status || 'Not set';
  const note = (req.body.note || '').trim();

  if (!area) return err(res, 'Area is required', 400);
  if (!desc.length) return err(res, 'Description is required', 400);

  try {
    const maxSno = db.prepare('SELECT COALESCE(MAX(sno),0) AS m FROM d1_prerequisites').get().m;
    const meta = computeMeta(area, desc, det, bnk, qkArr, due, status, note);

    const result = db.prepare(`
      INSERT INTO d1_prerequisites
        (sno, area, description, details, bank, qk, due, status, note, due_display, due_month, state, owner, ord, search_text)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      maxSno + 1,
      area,
      JSON.stringify(desc),
      JSON.stringify(det),
      JSON.stringify(bnk),
      JSON.stringify(qkArr),
      due,
      status,
      note,
      meta.dueDisplay,
      meta.month,
      meta.state,
      meta.owner,
      meta.ord,
      meta.search
    );

    const created = db.prepare('SELECT * FROM d1_prerequisites WHERE id = ?').get(result.lastInsertRowid);
    ok(res, formatRow(created));
  } catch (e) {
    console.error('[day1] POST prerequisites:', e.message);
    err(res, 'Failed to create prerequisite');
  }
});

/* PUT /api/day1/prerequisites/:id (optimistic locking) */
router.put('/prerequisites/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { version } = req.body;

  const area = (req.body.area || req.body.Area || '').trim();
  const desc = Array.isArray(req.body.description) ? req.body.description : parseJson(req.body.description);
  const det  = Array.isArray(req.body.details)     ? req.body.details     : parseJson(req.body.details);
  const bnk  = Array.isArray(req.body.bank)        ? req.body.bank        : parseJson(req.body.bank);
  const qkArr= Array.isArray(req.body.qk)          ? req.body.qk          : parseJson(req.body.qk);
  const due  = (req.body.due || req.body.due_date || '').trim();
  const status = req.body.status || req.body.state || req.body.Status || 'Not set';
  const note = (req.body.note || '').trim();

  if (!area) return err(res, 'Area is required', 400);
  if (!desc.length) return err(res, 'Description is required', 400);
  if (version === undefined || version === null) return err(res, 'version is required', 400);

  try {
    const current = db.prepare('SELECT * FROM d1_prerequisites WHERE id = ?').get(id);
    if (!current) return err(res, 'Record not found', 404);

    if (current.version !== Number(version)) {
      return res.status(409).json({
        ok: false,
        error: 'This record was modified by another user. Reloading latest data...',
        serverVersion: current.version
      });
    }

    const meta = computeMeta(area, desc, det, bnk, qkArr, due, status, note);

    const result = db.prepare(`
      UPDATE d1_prerequisites SET
        area = ?, description = ?, details = ?, bank = ?, qk = ?,
        due = ?, status = ?, note = ?,
        due_display = ?, due_month = ?, state = ?, owner = ?, ord = ?, search_text = ?,
        version = version + 1,
        updated_at = datetime('now')
      WHERE id = ? AND version = ?
    `).run(
      area,
      JSON.stringify(desc),
      JSON.stringify(det),
      JSON.stringify(bnk),
      JSON.stringify(qkArr),
      due,
      status,
      note,
      meta.dueDisplay,
      meta.month,
      meta.state,
      meta.owner,
      meta.ord,
      meta.search,
      id,
      Number(version)
    );

    if (result.changes === 0) {
      return res.status(409).json({ ok: false, error: 'Concurrent update conflict — please refresh.' });
    }

    const updated = db.prepare('SELECT * FROM d1_prerequisites WHERE id = ?').get(id);
    ok(res, formatRow(updated));
  } catch (e) {
    console.error('[day1] PUT prerequisites:', e.message);
    err(res, 'Failed to update prerequisite');
  }
});

/* DELETE /api/day1/prerequisites/:id */
router.delete('/prerequisites/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = db.prepare('DELETE FROM d1_prerequisites WHERE id = ?').run(id);
    if (result.changes === 0) return err(res, 'Record not found', 404);
    ok(res, { id });
  } catch (e) {
    console.error('[day1] DELETE prerequisites:', e.message);
    err(res, 'Failed to delete prerequisite');
  }
});

/* ═══════════════════════════════════════════════════════════════
   MOBILISATION
═══════════════════════════════════════════════════════════════ */

/* GET /api/day1/mobilisation */
router.get('/mobilisation', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM d1_mobilisation ORDER BY id').all();
    ok(res, rows);
  } catch (e) {
    console.error('[day1] GET mobilisation:', e.message);
    err(res, 'Failed to load mobilisation data');
  }
});

/* PUT /api/day1/mobilisation/batch — update all rows at once */
router.put('/mobilisation/batch', (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows)) return err(res, 'rows array is required', 400);

  try {
    const upd = db.prepare(`
      UPDATE d1_mobilisation SET
        item_label = ?, day1_value = ?, full_ramp_value = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const updateAll = db.transaction((list) => {
      for (const r of list) {
        upd.run((r.item_label || '').trim(), (r.day1_value || '').trim(), (r.full_ramp_value || '').trim(), r.id);
      }
    });

    updateAll(rows);
    const updated = db.prepare('SELECT * FROM d1_mobilisation ORDER BY id').all();
    ok(res, updated);
  } catch (e) {
    console.error('[day1] PUT mobilisation batch:', e.message);
    err(res, 'Failed to update mobilisation rows');
  }
});

/* PUT /api/day1/mobilisation/:id — update single row */
router.put('/mobilisation/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { item_label, day1_value, full_ramp_value } = req.body;
  try {
    const result = db.prepare(`
      UPDATE d1_mobilisation SET
        item_label = COALESCE(?, item_label),
        day1_value = ?, full_ramp_value = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      item_label ? item_label.trim() : null,
      (day1_value      || '').trim(),
      (full_ramp_value || '').trim(),
      id
    );
    if (result.changes === 0) return err(res, 'Record not found', 404);
    const updated = db.prepare('SELECT * FROM d1_mobilisation WHERE id = ?').get(id);
    ok(res, updated);
  } catch (e) {
    console.error('[day1] PUT mobilisation:', e.message);
    err(res, 'Failed to update mobilisation row');
  }
});

/* ═══════════════════════════════════════════════════════════════
   OBSERVATIONS
═══════════════════════════════════════════════════════════════ */

/* GET /api/day1/observations */
router.get('/observations', (_req, res) => {
  try {
    const row = db.prepare('SELECT * FROM d1_observations ORDER BY id LIMIT 1').get();
    const content = (row && row.content) || '';
    ok(res, { id: (row && row.id) || null, content, body_html: content });
  } catch (e) {
    console.error('[day1] GET observations:', e.message);
    err(res, 'Failed to load observations');
  }
});

/* PUT /api/day1/observations */
router.put('/observations', (req, res) => {
  const content = req.body.content !== undefined ? req.body.content : (req.body.body_html || '');
  try {
    const existing = db.prepare('SELECT id FROM d1_observations ORDER BY id LIMIT 1').get();
    if (existing) {
      db.prepare(`UPDATE d1_observations SET content = ?, updated_at = datetime('now') WHERE id = ?`)
        .run((content || '').trim(), existing.id);
    } else {
      db.prepare(`INSERT INTO d1_observations (content) VALUES (?)`).run((content || '').trim());
    }
    const updated = db.prepare('SELECT * FROM d1_observations ORDER BY id LIMIT 1').get();
    ok(res, { id: updated.id, content: updated.content, body_html: updated.content });
  } catch (e) {
    console.error('[day1] PUT observations:', e.message);
    err(res, 'Failed to save observations');
  }
});

module.exports = router;
