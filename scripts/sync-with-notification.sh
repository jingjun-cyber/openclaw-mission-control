#!/bin/bash

# Mission Control Sync with Telegram Notifications
# This script runs the sync:all command and sends Telegram notifications on failure

cd /Users/jingjun/.openclaw/workspace/projects/mission-control/apps/mission-control-app

# Telegram Bot configuration
TELEGRAM_BOT_TOKEN="7794532866:AAH5X6lZ7K8p9R2Q3W4E5r6T7Y8U9I0O1P2"
TELEGRAM_CHAT_ID="7794532866"

# Function to send Telegram message
send_telegram_message() {
    local message="$1"
    local url="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
    
    curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\": \"${TELEGRAM_CHAT_ID}\", \"text\": \"${message}\", \"parse_mode\": \"Markdown\"}"
}

# Function to get step name from error message
extract_step_name() {
    local error_msg="$1"
    # Extract step name from error message like "sync:agents failed with exit code 1"
    if [[ $error_msg =~ ([a-z_]+)\ failed ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "unknown"
    fi
}

echo "[mission-control] sync-all starting at $(date)"

# Run sync:all and capture output and exit code
output=$(npm run sync:all 2>&1)
exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "[mission-control] sync-all completed successfully"
    exit 0
else
    # Extract failed step name
    failed_step=$(extract_step_name "$output")
    
    # Create failure message
    failure_message="🚨 *Mission Control Sync Failed!*

*Time:* $(date)
*Exit Code:* $exit_code
*Failed Step:* $failed_step

*Error Details:*
\`\`\`
$output
\`\`\`

Please check the mission control logs for more details."
    
    # Send Telegram notification
    echo "[mission-control] Sending failure notification to Telegram..."
    send_telegram_message "$failure_message"
    
    echo "[mission-control] Failure notification sent"
    exit $exit_code
fi