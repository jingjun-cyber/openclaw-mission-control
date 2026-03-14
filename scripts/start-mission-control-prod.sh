#!/bin/zsh
set -euo pipefail

APP_DIR="/Users/jingjun/.openclaw/workspace/projects/mission-control/apps/mission-control-app"
LOG_DIR="$HOME/.openclaw/logs/mission-control"
mkdir -p "$LOG_DIR"

cd "$APP_DIR"

# Ensure deps
/opt/homebrew/bin/npm install >>"$LOG_DIR/install.log" 2>&1 || true

# Build (stable mode). If build fails, exit non-zero so launchd will restart later.
/opt/homebrew/bin/npm run build >>"$LOG_DIR/build.log" 2>&1

# Start Convex local deployment (background)
/opt/homebrew/bin/npm run convex:dev >>"$LOG_DIR/convex.log" 2>&1 &
CONVEX_PID=$!

# Wait for Convex
for i in {1..60}; do
  if /usr/bin/nc -z 127.0.0.1 3210 >/dev/null 2>&1; then
    break
  fi
  /bin/sleep 0.5
done

echo "[mission-control-prod] convex pid=$CONVEX_PID" >>"$LOG_DIR/runner.log"

cleanup() {
  echo "[mission-control-prod] stopping..." >>"$LOG_DIR/runner.log"
  kill $CONVEX_PID >/dev/null 2>&1 || true
}
trap cleanup INT TERM

# Run Next in the foreground so launchd can supervise this script.
# If Next exits, we stop Convex and exit non-zero so launchd restarts us.
/opt/homebrew/bin/npm run start -- -p 3000 >>"$LOG_DIR/next.log" 2>&1 || {
  code=$?
  cleanup
  exit $code
}
