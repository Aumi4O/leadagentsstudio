#!/usr/bin/env bash
# Wake Free-tier survey app on Render before sending email. No Starter plan needed.
# Usage: ./scripts/wake-survey-render.sh
# Optional: run twice, 60s apart, if the first request times out while cold.

set -euo pipefail
URL="${SURVEY_WAKE_URL:-https://lead-agents-survey.onrender.com/api/health}"
echo "GET $URL (may take up to ~90s if instance was sleeping)..."
curl -fsS --max-time 120 "$URL" && echo "OK — instance should be waking or warm."
