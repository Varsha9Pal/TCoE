#!/bin/bash
cd "$(dirname "$0")"

echo "========================================================"
echo "        Starting TCoE Engagement Review Server"
echo "========================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "Please download and install Node.js (v18+) from https://nodejs.org/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "[INFO] Detected Node.js: $(node -v)"
echo ""

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies (express, cors)..."
    npm install
fi

echo "[INFO] Starting server on http://localhost:3000 ..."
echo "[INFO] Press Ctrl + C to stop the server anytime."
echo ""

# Open default browser on macOS after 2 seconds
(sleep 2 && open "http://localhost:3000") &

npm start
