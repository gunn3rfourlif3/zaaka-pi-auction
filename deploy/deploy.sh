#!/usr/bin/env bash
# ============================================================================
# Pi Auctions — build & release script for the VPS
# ----------------------------------------------------------------------------
# Pulls the latest code, installs deps, runs migrations, builds, and reloads
# the app under PM2 with zero-downtime. Run as the deploy user (not root).
#
#   Repo:  https://github.com/gunn3rfourlif3/zaaka-pi-auction.git
#   Usage: ./deploy/deploy.sh
# ============================================================================
set -euo pipefail

APP_DIR="/var/www/pi-auctions/current"
ENV_FILE="/etc/pi-auctions.env"          # secrets live here, outside the repo
BRANCH="${DEPLOY_BRANCH:-main}"

echo "▶ Deploying Pi Auctions (branch: $BRANCH)"
cd "$APP_DIR"

# 1. Load environment (DATABASE_URL, secrets, etc.) for migrate/build steps.
if [[ -f "$ENV_FILE" ]]; then
  set -a; # shellcheck disable=SC1090
  source "$ENV_FILE"; set +a
else
  echo "✖ Missing $ENV_FILE (create it with production secrets, chmod 600)"; exit 1
fi

# 2. Fetch latest code.
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

# 3. Install exact dependencies.
npm ci

# 4. Database: generate client and apply migrations from committed history.
npx prisma generate
npx prisma migrate deploy

# 5. Production build.
npm run build

# 6. Reload under PM2 (start on first run, hot-reload thereafter).
if pm2 describe pi-auctions >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.js --update-env
else
  pm2 start deploy/ecosystem.config.js
fi
pm2 save

echo "✅ Deploy complete."
