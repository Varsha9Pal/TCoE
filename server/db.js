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

/* ── Open database (Node.js built-in SQLite with better-sqlite3 fallback) ── */
let db;

try {
  // 1. Try Node.js built-in SQLite (Node 22+) — zero dependencies, zero compilation
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

  console.log('[db] ✓ SQLite ready using Node.js built-in SQLite at', dbPath);
} catch (err) {
  try {
    // 2. Fallback to better-sqlite3 (Node 18/20)
    const Database = require('better-sqlite3');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys  = ON');
    console.log('[db] ✓ SQLite ready using better-sqlite3 at', dbPath);
  } catch (err2) {
    console.error('[db] ✗ Failed to open SQLite database:', err.message, err2.message);
    process.exit(1);
  }
}

/* ── Initialise schema + seed data (idempotent) ─────────────── */
require('../db/init')(db);

module.exports = db;
