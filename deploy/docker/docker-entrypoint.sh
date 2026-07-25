#!/bin/sh
# Container entrypoint: wait for the database, apply migrations, then run CMD.
set -e

echo "▶ Applying database migrations (with retry until DB is ready)..."
tries=0
until npx prisma migrate deploy; do
  tries=$((tries + 1))
  if [ "$tries" -ge 30 ]; then
    echo "✖ Database not reachable after $tries attempts — giving up."
    exit 1
  fi
  echo "  …database not ready yet (attempt $tries/30), retrying in 2s"
  sleep 2
done

echo "✅ Migrations applied. Starting: $*"
exec "$@"
