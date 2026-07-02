#!/usr/bin/env bash
# Restart the dashboard Docker container (same image, no rebuild).
# To rebuild and run: docker compose up -d --build

set -euo pipefail
cd "$(dirname "$0")"

echo "Restarting dashboard..."
docker compose restart dashboard
PORT=$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)
echo "Done. App: http://localhost:${PORT:-8081}"
