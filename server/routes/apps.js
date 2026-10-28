'use strict';
/**
 * apps.js — REST API routes for Application List.
 * Full CRUD with optimistic concurrency control.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { logActivity } = require('../activityLogger');

const ok  = (res, data)        => res.json({ ok: true, data });
const err = (res, msg, status) => res.status(status || 500).json({ ok: false, error: msg });

function formatApp(r) {
  return {
    id:               r.id,
    Tower:            r.tower,
    tower:            r.tower,
    Module:           r.module,
    module:           r.module,
    'System Name':    r.system_name,
    system_name:      r.system_name,
    'Business usage': r.business_usage,
    business_usage:   r.business_usage,
    'Application Type': r.app_type,
    app_type:         r.app_type,
    'Technology Used':r.technology,
    technology:       r.technology,
    'Has API':        r.has_api,
    has_api:          r.has_api,
    'Approx. Monthly CR Count': String(r.monthly_cr),
    monthly_cr:       r.monthly_cr,
    _plat:            r.app_type || 'Not specified',
    _api:             r.has_api || 'No',
    _cr:              r.monthly_cr,
    version:          r.version
  };
}

/* GET /api/apps */
router.get('/', async (_req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM app_list ORDER BY id').all();
    ok(res, rows.map(formatApp));
  } catch (e) {
    console.error('[apps] GET apps:', e.message);
    err(res, 'Failed to load applications');
  }
});

/* POST /api/apps */
router.post('/', async (req, res) => {
  const tower          = (req.body.Tower || req.body.tower || '').trim();
  const moduleName     = (req.body.Module || req.body.module || '').trim();
  const systemName     = (req.body['System Name'] || req.body.system_name || '').trim();
  const businessUsage  = (req.body['Business usage'] || req.body.business_usage || '').trim();
  const appType        = (req.body['Application Type'] || req.body.app_type || '').trim();
  const technology     = (req.body['Technology Used'] || req.body.technology || '').trim();
  const hasApi         = (req.body['Has API'] || req.body.has_api || 'No').trim();
  const monthlyCr      = parseInt(req.body['Approx. Monthly CR Count'] || req.body.monthly_cr || 0, 10) || 0;

  if (!systemName) return err(res, 'System name is required', 400);

  try {
    const result = await db.prepare(`
      INSERT INTO app_list
        (tower, module, system_name, business_usage, app_type, technology, has_api, monthly_cr)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tower, moduleName, systemName, businessUsage, appType, technology, hasApi, monthlyCr);

    const created = await db.prepare('SELECT * FROM app_list WHERE id = ?').get(result.lastInsertRowid);
    const formatted = formatApp(created);

    await logActivity({
      entity_type: 'app',
      entity_id: created.id,
      entity_name: created.system_name,
      action: 'CREATE',
      summary: `Created application "${created.system_name}" (${created.tower || 'No tower'})`,
      details: { snapshot: formatted }
    });

    ok(res, formatted);
  } catch (e) {
    console.error('[apps] POST apps:', e.message);
    err(res, 'Failed to create application');
  }
});

/* PUT /api/apps/:id */
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { version } = req.body;

  const tower          = (req.body.Tower || req.body.tower || '').trim();
  const moduleName     = (req.body.Module || req.body.module || '').trim();
  const systemName     = (req.body['System Name'] || req.body.system_name || '').trim();
  const businessUsage  = (req.body['Business usage'] || req.body.business_usage || '').trim();
  const appType        = (req.body['Application Type'] || req.body.app_type || '').trim();
  const technology     = (req.body['Technology Used'] || req.body.technology || '').trim();
  const hasApi         = (req.body['Has API'] || req.body.has_api || 'No').trim();
  const monthlyCr      = parseInt(req.body['Approx. Monthly CR Count'] || req.body.monthly_cr || 0, 10) || 0;

  if (!systemName) return err(res, 'System name is required', 400);
  if (version === undefined || version === null) return err(res, 'version is required', 400);

  try {
    const current = await db.prepare('SELECT * FROM app_list WHERE id = ?').get(id);
    if (!current) return err(res, 'Application not found', 404);

    if (current.version !== Number(version)) {
      return res.status(409).json({
        ok: false,
        error: 'This application was modified by another user. Reloading latest data...',
        serverVersion: current.version
      });
    }

    const result = await db.prepare(`
      UPDATE app_list SET
        tower = ?, module = ?, system_name = ?, business_usage = ?,
        app_type = ?, technology = ?, has_api = ?, monthly_cr = ?,
        version = version + 1,
        updated_at = datetime('now')
      WHERE id = ? AND version = ?
    `).run(tower, moduleName, systemName, businessUsage, appType, technology, hasApi, monthlyCr, id, Number(version));

    if (result.changes === 0) {
      return res.status(409).json({ ok: false, error: 'Concurrent update conflict — please refresh.' });
    }

    const updated = await db.prepare('SELECT * FROM app_list WHERE id = ?').get(id);
    const formatted = formatApp(updated);

    const changes = [];
    if (current.tower !== tower) changes.push({ field: 'Tower', old: current.tower, new: tower });
    if (current.module !== moduleName) changes.push({ field: 'Module', old: current.module, new: moduleName });
    if (current.system_name !== systemName) changes.push({ field: 'System Name', old: current.system_name, new: systemName });
    if (current.business_usage !== businessUsage) changes.push({ field: 'Business usage', old: current.business_usage, new: businessUsage });
    if (current.app_type !== appType) changes.push({ field: 'Application Type', old: current.app_type, new: appType });
    if (current.technology !== technology) changes.push({ field: 'Technology', old: current.technology, new: technology });
    if (current.has_api !== hasApi) changes.push({ field: 'Has API', old: current.has_api, new: hasApi });
    if (current.monthly_cr !== monthlyCr) changes.push({ field: 'Monthly CR', old: current.monthly_cr, new: monthlyCr });

    await logActivity({
      entity_type: 'app',
      entity_id: id,
      entity_name: updated.system_name,
      action: 'UPDATE',
      summary: `Updated application "${updated.system_name}"`,
      details: { changes, snapshot: formatted }
    });

    ok(res, formatted);
  } catch (e) {
    console.error('[apps] PUT apps:', e.message);
    err(res, 'Failed to update application');
  }
});

/* DELETE /api/apps/:id */
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const current = await db.prepare('SELECT * FROM app_list WHERE id = ?').get(id);
    if (!current) return err(res, 'Application not found', 404);

    const snapshot = formatApp(current);
    const result = await db.prepare('DELETE FROM app_list WHERE id = ?').run(id);
    if (result.changes === 0) return err(res, 'Application not found', 404);

    await logActivity({
      entity_type: 'app',
      entity_id: id,
      entity_name: current.system_name,
      action: 'DELETE',
      summary: `Deleted application "${current.system_name}" (${current.tower || 'No tower'})`,
      details: { snapshot },
      is_deleted: 1
    });

    ok(res, { id, name: current.system_name });
  } catch (e) {
    console.error('[apps] DELETE apps:', e.message);
    err(res, 'Failed to delete application');
  }
});

module.exports = router;
