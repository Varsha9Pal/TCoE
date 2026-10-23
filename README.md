# TCoE Engagement Review Application

An interactive web application and live tracking dashboard for Quality Engineering transition readiness, application estate inventory, tester allocations, tower matrix ownership, and Day 1 mobilization.

---

## 🚀 Quick Start (Easiest Way)

### On Windows:
Just **double-click** the file:
```
start.bat
```
It will automatically:
1. Verify Node.js is installed.
2. Install required packages (if running for the first time).
3. Start the server on `http://localhost:3000`.
4. Automatically open your default web browser to the dashboard.

---

## 🛠 Manual Start (Terminal / Command Line)

### Prerequisites:
- [Node.js](https://nodejs.org/) (Version 18 or higher)

### Steps:
1. Open terminal / command prompt in this folder.
2. Install dependencies (only required once):
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📁 Key Features & Navigation

- **Summary Dashboard**: High-level KPIs, change volumes, vendor breakdown, and estate overview.
- **Application List**: 98 applications with real-time column sorting (`▲`/`▼`), search filtering, inline editing, and adding/deleting applications.
- **Current State Team**: 115 tester resources across vendors and SDG verticals with sorting, inline editing, and adding/deleting.
- **Tower Heads & Ownership Matrix**: 5 delivery towers with an editable Ownership Matrix. Allows adding new heads (`+ Add Head`) and removing heads with automated span recalculations.
- **Day 1 Readiness**: Mobilisation trackers and prerequisite milestones with inline editing.
- **Change History & Recycle Bin**: Click **`🕒 Activity & Trash`** in the top navigation to view the audit log of all changes or restore deleted items with one click (`↺ Restore`).

---

## 🗄️ Database
- SQLite database stored at `data/tcoe.db`.
- All edits, deletions, and activities persist automatically.
