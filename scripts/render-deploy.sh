#!/usr/bin/env bash
# Trigger a Render deploy for the Next.js app (rootDir: account in render.yaml).
#
# One-time setup:
#   brew install render   # if needed
#   render login
#   render workspace set  # choose your Render workspace/team
#
# Usage:
#   ./scripts/render-deploy.sh [service-id-or-name]
#   RENDER_SERVICE=lead-agents-studio-account ./scripts/render-deploy.sh
#
# Optional: set RENDER_API_KEY instead of render login (Dashboard → Account → API Keys).

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

usage() {
  cat <<'EOF'
Usage: ./scripts/render-deploy.sh <service-id|service-name>

Examples:
  render services -o json | head     # find srv-… id or use the display name
  ./scripts/render-deploy.sh lead-agents-studio-account
  ./scripts/render-deploy.sh srv-xxxxxxxxxxxx

Env:
  RENDER_SERVICE   default service if no argument is passed

Prereqs:
  render login && render workspace set
EOF
  exit 1
}

command -v render >/dev/null 2>&1 || {
  echo "Install Render CLI: brew install render"
  exit 1
}

SERVICE="${1:-${RENDER_SERVICE:-}}"
[[ -n "$SERVICE" ]] || usage

if render workspace current -o text >/dev/null 2>&1; then
  echo "==> Validating render.yaml"
  render blueprints validate ./render.yaml -o text
fi

echo "==> Deploying: $SERVICE (clear cache, wait for result)"
exec render deploys create "$SERVICE" --confirm --clear-cache --wait
