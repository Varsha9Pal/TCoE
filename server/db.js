'use strict';
require('dotenv').config();
const path     = require('path');
const fs       = require('fs');
const Database = require('better-sqlite3');

/* ── Resolve database file path ─────────────────────────────── */
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'tcoe.db');

/* ── Ensure parent directory exists ─────────────────────────── */
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

/* ── Open database ───────────────────────────────────────────── */
let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');   // WAL mode: better read/write concurrency
  db.pragma('foreign_keys  = ON');
  console.log('[db] \u2713 SQLite database ready at', dbPath);
} catch (err) {
  console.error('[db] \u2717 Failed to open SQLite database:', err.message);
  process.exit(1);
}

/* ── Initialise schema + seed data (idempotent) ─────────────── */
require('../db/init')(db);

module.exports = db;
