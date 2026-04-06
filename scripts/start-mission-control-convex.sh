#!/bin/zsh
set -euo pipefail

APP_DIR="/Users/jingjun/.openclaw/workspace/projects/mission-control/apps/mission-control-app"
LOG_DIR="$HOME/.openclaw/logs/mission-control"
mkdir -p "$LOG_DIR"

cd "$APP_DIR"
exec ./node_modules/.bin/convex dev --local --local-force-upgrade >>"$LOG_DIR/convex.log" 2>&1
