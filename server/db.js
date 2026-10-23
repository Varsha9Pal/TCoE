'use strict';
try { require('dotenv').config(); } catch (_) {}
const path = require('path');
const fs   = require('fs');

/* ── Resolve database file path ─────────────────────────────── */
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'tcoe.db');

/* ── Ensure parent directory exists ─────────────────────────── */
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

/* ── Open database (better-sqlite3 with node:sqlite fallback) ── */
let db;
let Database;

try {
  Database = require('better-sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys  = ON');
  console.log('[db] ✓ SQLite database ready (better-sqlite3) at', dbPath);
} catch (err) {
  try {
    const { DatabaseSync } = require('node:sqlite');
    db = new DatabaseSync(dbPath);
    db.pragma = (str) => {
      try { db.exec('PRAGMA ' + str); } catch (_) {}
    };
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.transaction = (fn) => {
      return (...args) => {
        db.exec('BEGIN');
        try {
          const res = fn(...args);
          db.exec('COMMIT');
          return res;
        } catch (e) {
          try { db.exec('ROLLBACK'); } catch (_) {}
          throw e;
        }
      };
    };

    console.log('[db] ✓ SQLite database ready (node:sqlite built-in) at', dbPath);
  } catch (err2) {
    console.error('[db] ✗ Failed to open SQLite database:', err.message, err2.message);
    process.exit(1);
  }
}

/* ── Initialise schema + seed data (idempotent) ─────────────── */
require('../db/init')(db);

module.exports = db;
