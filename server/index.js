'use strict';
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const day1Routes   = require('./routes/day1');
const appsRoutes   = require('./routes/apps');
const teamRoutes   = require('./routes/team');
const towersRoutes = require('./routes/towers');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve the HTML prototype as the root page
app.use(express.static(path.join(__dirname, '..')));

// Explicit root route to serve "TCoE Engagement.html"
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'TCoE Engagement.html'));
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/day1', day1Routes);
app.use('/api/apps', appsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/towers', towersRoutes);

// Health-check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── 404 for unknown API paths ─────────────────────────────────────────────────
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] TCoE Engagement running on http://0.0.0.0:${PORT}`);
  console.log(`[server] Open http://localhost:${PORT} in your browser`);
  console.log(`[server] Other computers on the network: http://<this-machine-IP>:${PORT}`);
});

module.exports = app;
