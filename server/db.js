'use strict';
/**
 * db.js — Database client with Turso (cloud SQLite) as primary
 * and local SQLite (Node.js built-in) as fallback for local dev.
 *
 * Exposes an async interface: db.prepare(sql).all(...params)
 *                                              .get(...params)
 *                                              .run(...params)
 * so all route files use async/await.
 */
try { require('dotenv').config(); } catch (_) {}

const TURSO_URL   = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

/* ── Turso / libSQL async client ──────────────────────────────── */
function buildTursoClient() {
  const { createClient } = require('@libsql/client');
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // Wrap client to expose prepare().all/.get/.run interface (async)
  function prepare(sql) {
    return {
      async all(...args) {
        const named = toNamed(sql, args);
        const rs = await client.execute({ sql: named.sql, args: named.args });
        return rs.rows.map(rowToObj);
      },
      async get(...args) {
        const named = toNamed(sql, args);
        const rs = await client.execute({ sql: named.sql, args: named.args });
        return rs.rows.length ? rowToObj(rs.rows[0]) : undefined;
      },
      async run(...args) {
        const named = toNamed(sql, args);
        const rs = await client.execute({ sql: named.sql, args: named.args });
        return { changes: Number(rs.rowsAffected), lastInsertRowid: Number(rs.lastInsertRowid) };
      }
    };
  }

  async function exec(sql) {
    // exec may contain multiple statements separated by semicolons
    const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const s of stmts) {
      await client.execute(s);
    }
  }

  // Turso uses positional ? params — pass as array
  function toNamed(sql, args) {
    // If single object arg (named params from better-sqlite3 @name style), convert
    if (args.length === 1 && args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      // Convert @param style to positional
      const obj = args[0];
      const positional = [];
      const newSql = sql.replace(/@(\w+)/g, (_, key) => {
        positional.push(obj[key] !== undefined ? obj[key] : null);
        return '?';
      });
      return { sql: newSql, args: positional };
    }
    return { sql, args: args.flat() };
  }

  function rowToObj(row) {
    // libsql rows are array-like with column name keys
    const obj = {};
    for (const key of Object.keys(row)) {
      obj[key] = row[key];
    }
    return obj;
  }

  // Transaction: run a list of execute calls in a batch
  function transaction(fn) {
    return async (...args) => {
      // libsql cloud doesn't support interactive transactions on free tier;
      // use batch execute for atomicity
      const ops = [];
      const capture = [];
      // We collect ops by running fn with a proxy that records calls
      // Simple approach: just run sequentially (Turso free tier is single-writer anyway)
      await client.execute('BEGIN');
      try {
        await fn(...args);
        await client.execute('COMMIT');
      } catch (e) {
        try { await client.execute('ROLLBACK'); } catch (_) {}
        throw e;
      }
    };
  }

  console.log('[db] ✅ Using Turso cloud SQLite at', TURSO_URL);
  return { prepare, exec, transaction };
}

/* ── Local SQLite fallback (Node 22+ built-in) ────────────────── */
function buildLocalClient() {
  const path = require('path');
  const fs   = require('fs');
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, '..', 'data', 'tcoe.db');

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  let rawDb;
  try {
    const { DatabaseSync } = require('node:sqlite');
    rawDb = new DatabaseSync(dbPath);
    rawDb.exec('PRAGMA journal_mode = WAL');
    rawDb.exec('PRAGMA foreign_keys = ON');
    console.log('[db] ✅ Using local SQLite (Node built-in) at', dbPath);
  } catch (_) {
    const Database = require('better-sqlite3');
    rawDb = new Database(dbPath);
    rawDb.pragma('journal_mode = WAL');
    rawDb.pragma('foreign_keys = ON');
    console.log('[db] ✅ Using local SQLite (better-sqlite3) at', dbPath);
  }

  // Wrap sync API to return Promises so routes work the same way
  function prepare(sql) {
    return {
      async all(...args) {
        const stmt = rawDb.prepare(sql);
        return args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])
          ? stmt.all(args[0])
          : stmt.all(...args);
      },
      async get(...args) {
        const stmt = rawDb.prepare(sql);
        return args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])
          ? stmt.get(args[0])
          : stmt.get(...args);
      },
      async run(...args) {
        const stmt = rawDb.prepare(sql);
        const r = args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])
          ? stmt.run(args[0])
          : stmt.run(...args);
        return { changes: r.changes, lastInsertRowid: r.lastInsertRowid };
      }
    };
  }

  async function exec(sql) {
    rawDb.exec(sql);
  }

  function transaction(fn) {
    const txFn = rawDb.transaction ? rawDb.transaction(fn) : fn;
    return async (...args) => txFn(...args);
  }

  return { prepare, exec, transaction };
}

/* ── Pick client ──────────────────────────────────────────────── */
let db;
if (TURSO_URL && TURSO_TOKEN) {
  db = buildTursoClient();
} else {
  console.log('[db] TURSO_DATABASE_URL not set — falling back to local SQLite');
  db = buildLocalClient();
}

module.exports = db;
