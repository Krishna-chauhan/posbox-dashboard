#!/usr/bin/env bash
# Stop the dashboard Docker stack.

set -euo pipefail
cd "$(dirname "$0")"

echo "Stopping dashboard..."
docker compose down
echo "Done. Dashboard is stopped."
