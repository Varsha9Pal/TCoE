# TCoE Engagement — Day 1 Readiness Backend
## Setup, Configuration, and Operational Guide

---

## Overview

The application runs on **Node.js + Express** with a lightweight, high-performance embedded database powered by **better-sqlite3 (WAL mode)**. 
- **Zero external database installation required**: No MySQL server installation or background service needed.
- **Self-contained database file**: Stored locally in `data/tcoe.db`.
- **Automatic Initialization**: Schema creation and seed data (all 30 prototype prerequisite rows, 7 mobilisation rows, and readiness observations) are loaded automatically on first startup.
- **Shared Office/Team Access**: When hosted on an office machine, multiple team members can access and manage the shared data simultaneously over the local network via their web browsers.

---

## 1 · Quick Start

Open a terminal in `d:\TCoE_Engagement`:

```powershell
npm start
```

Or:

```powershell
node server/index.js
```

The console will show:
```
[db] ✓ SQLite database ready at D:\TCoE_Engagement\data\tcoe.db
[server] TCoE Engagement running on http://0.0.0.0:3000
[server] Open http://localhost:3000 in your browser
[server] Other computers on the network: http://<this-machine-IP>:3000
```

Open your browser to:
**http://localhost:3000**

---

## 2 · Environment Configuration

Configuration is located in `.env`:

```ini
# SQLite database file path (relative to project root or absolute)
DB_PATH=./data/tcoe.db

# Server port (default 3000)
PORT=3000
```

---

## 3 · Office Network Access (Multi-User Team Use)

To let team members connect from their respective computers:

1. Find the host machine's IP address by running `ipconfig` in PowerShell (e.g. `192.168.1.50`).
2. Share the URL with your team: `http://192.168.1.50:3000`
3. Ensure port 3000 is open in Windows Firewall if required:
   ```powershell
   New-NetFirewallRule -DisplayName "TCoE Node Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

---

## 4 · Database Backups and Restore

### Backup
Simply copy the database file located at `data/tcoe.db`:
```powershell
Copy-Item "d:\TCoE_Engagement\data\tcoe.db" "d:\TCoE_Engagement\data\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
```

### Restore
To restore from a backup, stop the server, replace `data/tcoe.db` with your backup copy, and restart the server.

---

## 5 · REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck endpoint |
| `GET` | `/api/day1/prerequisites` | Fetch all prerequisites |
| `POST` | `/api/day1/prerequisites` | Add a new prerequisite |
| `PUT` | `/api/day1/prerequisites/:id` | Update prerequisite (with optimistic locking) |
| `DELETE` | `/api/day1/prerequisites/:id` | Delete prerequisite |
| `GET` | `/api/day1/mobilisation` | Fetch mobilisation figures |
| `PUT` | `/api/day1/mobilisation/:id` | Update mobilisation numbers |
| `GET` | `/api/day1/observations` | Fetch readiness observations text |
| `PUT` | `/api/day1/observations` | Save readiness observations |
