#!/bin/zsh
set -euo pipefail

APP_DIR="/Users/jingjun/.openclaw/workspace/projects/mission-control/apps/mission-control-app"
LOG_DIR="$HOME/.openclaw/logs/mission-control"
mkdir -p "$LOG_DIR"

cd "$APP_DIR"

# Ensure deps are present (no-op if already installed)
if [ ! -d node_modules ]; then
  /opt/homebrew/bin/npm install
fi

# Start Convex + Next.js
# Keep them in the foreground by waiting on both; if either exits, kill the other.
/opt/homebrew/bin/npm run convex:dev >"$LOG_DIR/convex.log" 2>&1 &
CONVEX_PID=$!

# Wait for Convex port 3210 to open (max ~20s)
for i in {1..40}; do
  if /usr/bin/nc -z 127.0.0.1 3210 >/dev/null 2>&1; then
    break
  fi
  /bin/sleep 0.5
done

/opt/homebrew/bin/npm run dev >"$LOG_DIR/next.log" 2>&1 &
NEXT_PID=$!

echo "[mission-control] started convex pid=$CONVEX_PID, next pid=$NEXT_PID" >>"$LOG_DIR/runner.log"

default_cleanup() {
  echo "[mission-control] stopping..." >>"$LOG_DIR/runner.log"
  kill $NEXT_PID >/dev/null 2>&1 || true
  kill $CONVEX_PID >/dev/null 2>&1 || true
}
trap default_cleanup INT TERM EXIT

wait $CONVEX_PID $NEXT_PID
