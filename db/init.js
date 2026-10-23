'use strict';
/**
 * init.js — SQLite database initialization and seeding for all tabs:
 * 1. Day 1 Readiness (d1_prerequisites, d1_mobilisation, d1_observations)
 * 2. Applications (app_list)
 * 3. Team (team_members)
 * 4. Towers (tower_config)
 */
const path = require('path');

module.exports = function initDb(db) {
  /* ── 1. DAY 1 READINESS TABLES ───────────────────────────── */
  db.exec(`
    CREATE TABLE IF NOT EXISTS d1_prerequisites (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sno         INTEGER NOT NULL DEFAULT 0,
      area        TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '[]',
      details     TEXT    NOT NULL DEFAULT '[]',
      bank        TEXT    NOT NULL DEFAULT '[]',
      qk          TEXT    NOT NULL DEFAULT '[]',
      due         TEXT    NOT NULL DEFAULT '',
      status      TEXT    NOT NULL DEFAULT 'Not set',
      note        TEXT    NOT NULL DEFAULT '',
      due_display TEXT    NOT NULL DEFAULT '',
      due_month   TEXT    NOT NULL DEFAULT '',
      state       TEXT    NOT NULL DEFAULT 'Not set',
      owner       TEXT    NOT NULL DEFAULT '',
      ord         INTEGER NOT NULL DEFAULT 0,
      search_text TEXT    NOT NULL DEFAULT '',
      version     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS d1_mobilisation (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      item_label      TEXT NOT NULL,
      day1_value      TEXT NOT NULL DEFAULT '',
      full_ramp_value TEXT NOT NULL DEFAULT '',
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS d1_observations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      content    TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  /* ── 2. APPLICATION LIST TABLE ───────────────────────────── */
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_list (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      tower         TEXT NOT NULL DEFAULT '',
      module        TEXT NOT NULL DEFAULT '',
      system_name   TEXT NOT NULL DEFAULT '',
      business_usage TEXT NOT NULL DEFAULT '',
      app_type      TEXT NOT NULL DEFAULT '',
      technology    TEXT NOT NULL DEFAULT '',
      has_api       TEXT NOT NULL DEFAULT 'No',
      monthly_cr    INTEGER NOT NULL DEFAULT 0,
      version       INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  /* ── 3. TEAM MEMBERS TABLE ───────────────────────────────── */
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      sr_no         INTEGER NOT NULL DEFAULT 0,
      resource_name TEXT NOT NULL DEFAULT '',
      current_vendor TEXT NOT NULL DEFAULT '',
      sdg_segment   TEXT NOT NULL DEFAULT '',
      sdg_vertical  TEXT NOT NULL DEFAULT '',
      vertical_head TEXT NOT NULL DEFAULT '',
      location      TEXT NOT NULL DEFAULT '',
      system_name   TEXT NOT NULL DEFAULT '',
      version       INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  /* ── 4. TOWER CONFIG TABLE ───────────────────────────────── */
  db.exec(`
    CREATE TABLE IF NOT EXISTS tower_config (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tower_key   TEXT NOT NULL UNIQUE,
      tower_name  TEXT NOT NULL DEFAULT '',
      scope       TEXT NOT NULL DEFAULT '',
      vertical    TEXT NOT NULL DEFAULT '',
      heads_json  TEXT NOT NULL DEFAULT '[]',
      version     INTEGER NOT NULL DEFAULT 0,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  /* ── 5. ACTIVITY LOG & RECYCLE BIN TABLE ────────────────── */
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type  TEXT NOT NULL,
      entity_id    TEXT NOT NULL DEFAULT '',
      entity_name  TEXT NOT NULL DEFAULT '',
      action       TEXT NOT NULL,
      summary      TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      is_deleted   INTEGER NOT NULL DEFAULT 0,
      is_restored  INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  /* ── SEED PREREQUISITES ──────────────────────────────────── */
  const prereqCount = db.prepare('SELECT COUNT(*) AS n FROM d1_prerequisites').get().n;
  if (prereqCount === 0) {
    try {
      const originalItems = require('./original_day1.json');
      const insPre = db.prepare(`
        INSERT INTO d1_prerequisites
          (sno, area, description, details, bank, qk, due, status, note, due_display, due_month, state, owner, ord, search_text)
        VALUES
          (@sno, @area, @description, @details, @bank, @qk, @due, @status, @note, @due_display, @due_month, @state, @owner, @ord, @search_text)
      `);
      const insertPrereqs = db.transaction((items) => {
        for (const it of items) {
          insPre.run({
            sno: it.sno,
            area: it.Area,
            description: JSON.stringify(it.Description || []),
            details: JSON.stringify(it.Details || []),
            bank: JSON.stringify(it.Bank || []),
            qk: JSON.stringify(it.QK || []),
            due: it.Due || '',
            status: it.Status || 'Not set',
            note: it.Note || '',
            due_display: it._due || it.Due || '',
            due_month: it._month || 'Not dated',
            state: it._state || it.Status || 'Not set',
            owner: it._owner || 'Joint / unassigned',
            ord: it._ord || 0,
            search_text: it._search || ''
          });
        }
      });
      insertPrereqs(originalItems);
      console.log('[db] ✓ Seeded', originalItems.length, 'prerequisites');
    } catch(e) {
      console.warn('[db] Prerequisites seed warning:', e.message);
    }
  }

  /* ── SEED MOBILISATION ───────────────────────────────────── */
  const mobCount = db.prepare('SELECT COUNT(*) AS n FROM d1_mobilisation').get().n;
  if (mobCount === 0) {
    const insMob = db.prepare(`
      INSERT INTO d1_mobilisation (id, item_label, day1_value, full_ramp_value)
      VALUES (?, ?, ?, ?)
    `);
    const mobRows = [
      [1, 'Seats required', '53 from 1 Nov', '—'],
      [2, '&nbsp;&nbsp;Mumbai / Hyderabad / Chennai / Delhi', '44 / 6 / 1 / 2', '—'],
      [3, 'Laptops', '92 in month 1 (15 i7)', '135 by end of month 3'],
      [4, 'TestSigma licences', '—', '135'],
      [5, 'JIRA licences', '—', '135'],
      [6, 'Power BI licences', '—', '2 developer'],
      [7, 'Staff in transition scope', '110 existing (27 already QK)', 'Head-count under revision']
    ];
    for (const m of mobRows) insMob.run(...m);
    console.log('[db] ✓ Seeded 7 mobilisation rows');
  }

  /* ── SEED OBSERVATIONS ───────────────────────────────────── */
  const obsCount = db.prepare('SELECT COUNT(*) AS n FROM d1_observations').get().n;
  if (obsCount === 0) {
    const obsHtml = `<p><b>More falls due after go-live than before it.</b> 16 of the 30 prerequisites are dated November 2026 or later, against 10 in October. Items such as application access, tool licences and the AI/LLM approval are dated 1 November &mdash; the same day the team starts &mdash; which leaves no float if any of them slips. Pulling the access and licence items into October would de-risk the first week materially.</p>
<p><b>4 items are already past due</b> as at 22 October: LOI, KT / Transition, Automation, Governance. The LOI in particular gates the 1 November start, and the KT plan drives the transition of the existing team.</p>
<p><b>4 items carry no due date</b> (Project Kickoff, Logistics, ID creation, Assets), and 3 have no status recorded. Seating is among the undated ones, yet it needs 53 desks on 1 November. These should be dated before the next governance call.</p>
<p><b>Ownership is thin on the page.</b> 16 of the 30 rows name neither a Bank nor a QK action, so accountability has to be inferred from the area. Adding a named owner per line &mdash; rather than per column &mdash; would make the tracker usable in the daily core-group sync proposed under item 25.</p>
<p><b>Head-count still moving.</b> Item 11 revises the figure from 110 towards a new tower-wise number, and item 12 puts 27 of the 110 already with QK. The Current State Team tab in this page lists 115 testers, so the three figures (110, 115 and the revised number) need to be reconciled before the PO and licence counts of 135 are locked.</p>
<p><b>Tooling.</b> 3 tool items are tracked &mdash; TestSigma and JIRA at 135 licences each and Power BI at 2 &mdash; and the licence count of 135 matches the month-3 laptop number rather than the 115 testers in the current-state sheet, implying planned growth that should be confirmed in the SOW.</p>`;
    db.prepare(`INSERT INTO d1_observations (id, content) VALUES (1, ?)`).run(obsHtml);
    console.log('[db] ✓ Seeded observations');
  }

  /* ── SEED APPLICATIONS ───────────────────────────────────── */
  const appCount = db.prepare('SELECT COUNT(*) AS n FROM app_list').get().n;
  if (appCount === 0) {
    try {
      const apps = require('./original_apps.json');
      const insApp = db.prepare(`
        INSERT INTO app_list
          (tower, module, system_name, business_usage, app_type, technology, has_api, monthly_cr)
        VALUES
          (@tower, @module, @system_name, @business_usage, @app_type, @technology, @has_api, @monthly_cr)
      `);
      const insertApps = db.transaction((rows) => {
        for (const a of rows) {
          insApp.run({
            tower: a.Tower || '',
            module: a.Module || '',
            system_name: a['System Name'] || '',
            business_usage: a['Business usage'] || '',
            app_type: a['Application Type'] || '',
            technology: a['Technology Used'] || '',
            has_api: a['Has API'] || a._api || 'No',
            monthly_cr: parseInt(a['Approx. Monthly CR Count'] || a._cr || 0, 10) || 0
          });
        }
      });
      insertApps(apps);
      console.log('[db] ✓ Seeded', apps.length, 'applications into app_list');
    } catch(e) {
      console.warn('[db] Applications seed warning:', e.message);
    }
  }

  /* ── SEED TEAM MEMBERS ───────────────────────────────────── */
  const teamCount = db.prepare('SELECT COUNT(*) AS n FROM team_members').get().n;
  if (teamCount === 0) {
    try {
      const testers = require('./original_testers.json');
      const insTeam = db.prepare(`
        INSERT INTO team_members
          (sr_no, resource_name, current_vendor, sdg_segment, sdg_vertical, vertical_head, location, system_name)
        VALUES
          (@sr_no, @resource_name, @current_vendor, @sdg_segment, @sdg_vertical, @vertical_head, @location, @system_name)
      `);
      const insertTeam = db.transaction((rows) => {
        for (const t of rows) {
          insTeam.run({
            sr_no: t['Sr No'] || 0,
            resource_name: t['Resource Name'] || '',
            current_vendor: t['Current Vendor'] || '',
            sdg_segment: t['SDG Segment'] || '',
            sdg_vertical: t['SDG Vertical'] || '',
            vertical_head: t['SDG Vertical Head'] || '',
            location: t.Location || '',
            system_name: t['System / Platform Name'] || t._platform || ''
          });
        }
      });
      insertTeam(testers);
      console.log('[db] ✓ Seeded', testers.length, 'testers into team_members');
    } catch(e) {
      console.warn('[db] Team members seed warning:', e.message);
    }
  }

  /* ── SEED TOWER CONFIG ───────────────────────────────────── */
  const towerCount = db.prepare('SELECT COUNT(*) AS n FROM tower_config').get().n;
  if (towerCount === 0) {
    const insTow = db.prepare(`
      INSERT INTO tower_config (tower_key, tower_name, scope, vertical, heads_json)
      VALUES (@tower_key, @tower_name, @scope, @vertical, @heads_json)
    `);
    const initialTowers = [
      {
        tower_key: 'Tower 1',
        tower_name: 'Tower 1',
        scope: 'Liabilities, Wealth & CRM',
        vertical: 'Liabilities, Wealth & CRM',
        heads_json: JSON.stringify([
          { n: 'Abhijeet Davane', a: 'Liabilities', segs: ['SDG Liabilities'] },
          { n: 'Rajendra B',      a: 'CRM',         segs: ['SDG CRM & Contact Centre'] },
          { n: 'Riddhi Chhabra',   a: 'Wealth',      segs: ['SDG Wealth'] }
        ])
      },
      {
        tower_key: 'Tower 2',
        tower_name: 'Tower 2',
        scope: 'Assets, Credit Cards',
        vertical: 'Assets',
        heads_json: JSON.stringify([
          { n: 'Imtiyaz Vahora', a: 'Assets',       segs: ['Assets', 'CFD'] },
          { n: 'Sameer Arora',   a: 'Credit Cards', segs: ['Credit Card'] }
        ])
      },
      {
        tower_key: 'Tower 3',
        tower_name: 'Tower 3',
        scope: 'Rural Banking Group (Pragati)',
        vertical: 'Rural Banking Group',
        heads_json: JSON.stringify([
          { n: 'Rashmi Singh', a: 'Tower-wide ownership', segs: null }
        ])
      },
      {
        tower_key: 'Tower 4',
        tower_name: 'Tower 4',
        scope: 'Payments, Cards, Govt Business & TBG',
        vertical: 'Payments, Cards, Govt Business & TBG',
        heads_json: JSON.stringify([
          { n: 'Dev Ratan Suri', a: 'Tower-wide ownership', segs: null }
        ])
      },
      {
        tower_key: 'Tower 5',
        tower_name: 'Tower 5',
        scope: 'WBG Lending, Trade and Treasury',
        vertical: 'WBG Lending, Trade and Treasury',
        heads_json: JSON.stringify([
          { n: 'Priyesh R',   a: 'Tower-wide ownership', segs: null },
          { n: 'Jay Panchal', a: 'Tower-wide ownership', segs: null }
        ])
      }
    ];

    const insertTowers = db.transaction((rows) => {
      for (const r of rows) insTow.run(r);
    });
    insertTowers(initialTowers);
    console.log('[db] ✓ Seeded 5 towers into tower_config');
  }
};
