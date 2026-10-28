'use strict';
/**
 * team.js — REST API routes for Current State Team.
 * Full CRUD with optimistic concurrency control.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { logActivity } = require('../activityLogger');

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
router.get('/', async (_req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM team_members ORDER BY sr_no, id').all();
    ok(res, rows.map(formatTester));
  } catch (e) {
    console.error('[team] GET team:', e.message);
    err(res, 'Failed to load team members');
  }
});

/* POST /api/team */
router.post('/', async (req, res) => {
  const resourceName  = (req.body['Resource Name'] || req.body.resource_name || '').trim();
  const currentVendor = (req.body['Current Vendor'] || req.body.current_vendor || '').trim();
  const sdgSegment    = (req.body['SDG Segment'] || req.body.sdg_segment || '').trim();
  const sdgVertical   = (req.body['SDG Vertical'] || req.body.sdg_vertical || '').trim();
  const verticalHead  = (req.body['SDG Vertical Head'] || req.body.vertical_head || '').trim();
  const location      = (req.body.Location || req.body.location || '').trim();
  const systemName    = (req.body['System / Platform Name'] || req.body.system_name || '').trim();

  if (!resourceName) return err(res, 'Resource name is required', 400);

  try {
    const maxRow = await db.prepare('SELECT COALESCE(MAX(sr_no),0) AS m FROM team_members').get();
    const maxSr  = maxRow ? Number(maxRow.m) : 0;

    const result = await db.prepare(`
      INSERT INTO team_members
        (sr_no, resource_name, current_vendor, sdg_segment, sdg_vertical, vertical_head, location, system_name)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(maxSr + 1, resourceName, currentVendor, sdgSegment, sdgVertical, verticalHead, location, systemName);

    const created = await db.prepare('SELECT * FROM team_members WHERE id = ?').get(result.lastInsertRowid);
    const formatted = formatTester(created);

    await logActivity({
      entity_type: 'team',
      entity_id: created.id,
      entity_name: created.resource_name,
      action: 'CREATE',
      summary: `Added team member "${created.resource_name}" (${created.current_vendor || 'No vendor'})`,
      details: { snapshot: formatted }
    });

    ok(res, formatted);
  } catch (e) {
    console.error('[team] POST team:', e.message);
    err(res, 'Failed to create team member');
  }
});

/* PUT /api/team/:id */
router.put('/:id', async (req, res) => {
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
    const current = await db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
    if (!current) return err(res, 'Team member not found', 404);

    if (current.version !== Number(version)) {
      return res.status(409).json({
        ok: false,
        error: 'This team member was modified by another user. Reloading latest data...',
        serverVersion: current.version
      });
    }

    const result = await db.prepare(`
      UPDATE team_members SET
        resource_name = ?, current_vendor = ?, sdg_segment = ?, sdg_vertical = ?,
        vertical_head = ?, location = ?, system_name = ?,
        version = version + 1,
        updated_at = datetime('now')
      WHERE id = ? AND version = ?
    `).run(resourceName, currentVendor, sdgSegment, sdgVertical, verticalHead, location, systemName, id, Number(version));

    if (result.changes === 0) {
      return res.status(409).json({ ok: false, error: 'Concurrent update conflict — please refresh.' });
    }

    const updated = await db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
    const formatted = formatTester(updated);

    const changes = [];
    if (current.resource_name !== resourceName) changes.push({ field: 'Resource Name', old: current.resource_name, new: resourceName });
    if (current.current_vendor !== currentVendor) changes.push({ field: 'Vendor', old: current.current_vendor, new: currentVendor });
    if (current.sdg_segment !== sdgSegment) changes.push({ field: 'Segment', old: current.sdg_segment, new: sdgSegment });
    if (current.sdg_vertical !== sdgVertical) changes.push({ field: 'Vertical', old: current.sdg_vertical, new: sdgVertical });
    if (current.vertical_head !== verticalHead) changes.push({ field: 'Vertical Head', old: current.vertical_head, new: verticalHead });
    if (current.location !== location) changes.push({ field: 'Location', old: current.location, new: location });
    if (current.system_name !== systemName) changes.push({ field: 'Platform', old: current.system_name, new: systemName });

    await logActivity({
      entity_type: 'team',
      entity_id: id,
      entity_name: updated.resource_name,
      action: 'UPDATE',
      summary: `Updated team member "${updated.resource_name}"`,
      details: { changes, snapshot: formatted }
    });

    ok(res, formatted);
  } catch (e) {
    console.error('[team] PUT team:', e.message);
    err(res, 'Failed to update team member');
  }
});

/* DELETE /api/team/:id */
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const current = await db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
    if (!current) return err(res, 'Team member not found', 404);

    const snapshot = formatTester(current);
    const result = await db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
    if (result.changes === 0) return err(res, 'Team member not found', 404);

    await logActivity({
      entity_type: 'team',
      entity_id: id,
      entity_name: current.resource_name,
      action: 'DELETE',
      summary: `Deleted team member "${current.resource_name}" (${current.current_vendor || 'No vendor'})`,
      details: { snapshot },
      is_deleted: 1
    });

    ok(res, { id, name: current.resource_name });
  } catch (e) {
    console.error('[team] DELETE team:', e.message);
    err(res, 'Failed to delete team member');
  }
});

module.exports = router;
