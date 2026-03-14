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

# Start Convex local deployment (non-interactive safe)
# `--local-force-upgrade` avoids the backend upgrade prompt that breaks under launchd (no TTY).
./node_modules/.bin/convex dev --local --local-force-upgrade >>"$LOG_DIR/convex.log" 2>&1 &
CONVEX_PID=$!

# Wait for Convex
for i in {1..80}; do
  if /usr/bin/nc -z 127.0.0.1 3210 >/dev/null 2>&1; then
    break
  fi
  /bin/sleep 0.5
done

echo "[mission-control-daemon] convex pid=$CONVEX_PID" >>"$LOG_DIR/runner.log"

cleanup() {
  echo "[mission-control-daemon] stopping..." >>"$LOG_DIR/runner.log"
  kill $CONVEX_PID >/dev/null 2>&1 || true
}
trap cleanup INT TERM

# Run Next in foreground so launchd supervises it
/opt/homebrew/bin/npm run start -- -p 3000 >>"$LOG_DIR/next.log" 2>&1 || {
  code=$?
  cleanup
  exit $code
}
