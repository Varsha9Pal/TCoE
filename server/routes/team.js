'use strict';
/**
 * team.js — REST API routes for Current State Team.
 * Full CRUD with optimistic concurrency control.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');

const ok  = (res, data)        => res.json({ ok: true, data });
const err = (res, msg, status) => res.status(status || 500).json({ ok: false, error: msg });

function formatTester(r) {
  return {
    id:                       r.id,
    'Sr No':                  r.sr_no,
    sr_no:                    r.sr_no,
    'Resource Name':          r.resource_name,
    resource_name:            r.resource_name,
    'Current Vendor':         r.current_vendor,
    current_vendor:           r.current_vendor,
    'SDG Segment':            r.sdg_segment,
    sdg_segment:              r.sdg_segment,
    'SDG Vertical':           r.sdg_vertical,
    sdg_vertical:             r.sdg_vertical,
    'SDG Vertical Head':      r.vertical_head,
    vertical_head:            r.vertical_head,
    Location:                 r.location,
    location:                 r.location,
    'System / Platform Name': r.system_name,
    system_name:              r.system_name,
    _platform:                r.system_name || 'Not specified',
    version:                  r.version
  };
}

/* GET /api/team */
router.get('/', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM team_members ORDER BY sr_no, id').all();
    ok(res, rows.map(formatTester));
  } catch (e) {
    console.error('[team] GET team:', e.message);
    err(res, 'Failed to load team members');
  }
});

/* POST /api/team */
router.post('/', (req, res) => {
  const resourceName  = (req.body['Resource Name'] || req.body.resource_name || '').trim();
  const currentVendor = (req.body['Current Vendor'] || req.body.current_vendor || '').trim();
  const sdgSegment    = (req.body['SDG Segment'] || req.body.sdg_segment || '').trim();
  const sdgVertical   = (req.body['SDG Vertical'] || req.body.sdg_vertical || '').trim();
  const verticalHead  = (req.body['SDG Vertical Head'] || req.body.vertical_head || '').trim();
  const location      = (req.body.Location || req.body.location || '').trim();
  const systemName    = (req.body['System / Platform Name'] || req.body.system_name || '').trim();

  if (!resourceName) return err(res, 'Resource name is required', 400);

  try {
    const maxSr = db.prepare('SELECT COALESCE(MAX(sr_no),0) AS m FROM team_members').get().m;
    const result = db.prepare(`
      INSERT INTO team_members
        (sr_no, resource_name, current_vendor, sdg_segment, sdg_vertical, vertical_head, location, system_name)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      maxSr + 1, resourceName, currentVendor, sdgSegment, sdgVertical, verticalHead, location, systemName
    );

    const created = db.prepare('SELECT * FROM team_members WHERE id = ?').get(result.lastInsertRowid);
    ok(res, formatTester(created));
  } catch (e) {
    console.error('[team] POST team:', e.message);
    err(res, 'Failed to create team member');
  }
});

/* PUT /api/team/:id */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { version } = req.body;

  const resourceName  = (req.body['Resource Name'] || req.body.resource_name || '').trim();
  const currentVendor = (req.body['Current Vendor'] || req.body.current_vendor || '').trim();
  const sdgSegment    = (req.body['SDG Segment'] || req.body.sdg_segment || '').trim();
  const sdgVertical   = (req.body['SDG Vertical'] || req.body.sdg_vertical || '').trim();
  const verticalHead  = (req.body['SDG Vertical Head'] || req.body.vertical_head || '').trim();
  const location      = (req.body.Location || req.body.location || '').trim();
  const systemName    = (req.body['System / Platform Name'] || req.body.system_name || '').trim();

  if (!resourceName) return err(res, 'Resource name is required', 400);
  if (version === undefined || version === null) return err(res, 'version is required', 400);

  try {
    const current = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
    if (!current) return err(res, 'Team member not found', 404);

    if (current.version !== Number(version)) {
      return res.status(409).json({
        ok: false,
        error: 'This team member was modified by another user. Reloading latest data...',
        serverVersion: current.version
      });
    }

    const result = db.prepare(`
      UPDATE team_members SET
        resource_name = ?, current_vendor = ?, sdg_segment = ?, sdg_vertical = ?,
        vertical_head = ?, location = ?, system_name = ?,
        version = version + 1,
        updated_at = datetime('now')
      WHERE id = ? AND version = ?
    `).run(
      resourceName, currentVendor, sdgSegment, sdgVertical, verticalHead, location, systemName, id, Number(version)
    );

    if (result.changes === 0) {
      return res.status(409).json({ ok: false, error: 'Concurrent update conflict — please refresh.' });
    }

    const updated = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
    ok(res, formatTester(updated));
  } catch (e) {
    console.error('[team] PUT team:', e.message);
    err(res, 'Failed to update team member');
  }
});

/* DELETE /api/team/:id */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
    if (result.changes === 0) return err(res, 'Team member not found', 404);
    ok(res, { id });
  } catch (e) {
    console.error('[team] DELETE team:', e.message);
    err(res, 'Failed to delete team member');
  }
});

module.exports = router;
