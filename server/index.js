'use strict';
try { require('dotenv').config(); } catch (_) {}

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const day1Routes     = require('./routes/day1');
const appsRoutes     = require('./routes/apps');
const teamRoutes     = require('./routes/team');
const towersRoutes   = require('./routes/towers');
const activityRoutes = require('./routes/activity');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve the HTML prototype as the root page
app.use(express.static(path.join(__dirname, '..')));

// Explicit root route to serve "TCoE Engagement.html"
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'TCoE Engagement.html'));
});

// ── API routes ────────────────────────────────────────────────
app.use('/api/day1',     day1Routes);
app.use('/api/apps',     appsRoutes);
app.use('/api/team',     teamRoutes);
app.use('/api/towers',   towersRoutes);
app.use('/api/activity', activityRoutes);

// Health-check
app.get('/api/health', (_req, res) => {
  const isTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
  res.json({
    status: 'ok',
    database_mode: isTurso ? 'Turso Cloud (Persistent)' : 'Local SQLite (Temporary Ephemeral)',
    turso_url_configured: Boolean(process.env.TURSO_DATABASE_URL),
    time: new Date().toISOString()
  });
});

// ── 404 for unknown API paths ─────────────────────────────────
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
async function main() {
  // Initialise DB schema + seed (async for Turso)
  const db = require('./db');
  await require('../db/init')(db);

  function startServer(port) {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`[server] TCoE Engagement running on http://localhost:${port}`);
      console.log(`[server] Open http://localhost:${port} in your browser`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = Number(port) + 1;
        console.warn(`[server] Port ${port} is in use. Trying port ${nextPort}...`);
        startServer(nextPort);
      } else {
        console.error('[server] Server error:', err.message);
      }
    });
  }

  startServer(PORT);
}

main().catch(e => {
  console.error('[startup] Fatal error:', e.message);
  process.exit(1);
});

module.exports = app;
