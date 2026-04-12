#!/bin/zsh
set -euo pipefail

APP_DIR="/Users/jingjun/.openclaw/workspace/projects/mission-control/apps/mission-control-app"
LOG_DIR="/Users/jingjun/.openclaw/logs/mission-control"
mkdir -p "$LOG_DIR"

cd "$APP_DIR"

# Ensure deps (best effort)
/opt/homebrew/bin/npm install >>"$LOG_DIR/install.log" 2>&1 || true

# Build (stable mode)
/opt/homebrew/bin/npm run build >>"$LOG_DIR/build.log" 2>&1

# Wait for Convex managed by separate LaunchAgent
READY=0
for i in {1..80}; do
  if /usr/bin/nc -z 127.0.0.1 3210 >/dev/null 2>&1; then
    READY=1
    break
  fi
  /bin/sleep 0.5
done

if [[ "$READY" -ne 1 ]]; then
  echo "[mission-control-daemon] convex unavailable on 127.0.0.1:3210" >>"$LOG_DIR/runner.log"
  exit 1
fi

# Run Next in foreground so launchd supervises it
exec /opt/homebrew/bin/npm run start -- -p 3000 >>"$LOG_DIR/next.log" 2>&1
