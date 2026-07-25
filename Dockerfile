# syntax=docker/dockerfile:1

# ============================================================================
# Pi Auctions — multi-stage image
# Builds the Next.js app + custom Socket.IO server (server.js) and runs it
# with the full dependency set (needed for the custom server + Prisma CLI).
# ============================================================================

# ---- Stage 1: build ---------------------------------------------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# OpenSSL is required by the Prisma engines.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

# Install deps against the lockfile (cached unless package files change).
COPY package.json package-lock.json ./
RUN npm ci

# Generate the Prisma client (needs the schema).
COPY prisma ./prisma
RUN npx prisma generate

# Build the Next.js app. next build does not connect to the DB, but a
# DATABASE_URL must parse — provide a dummy for the build only.
COPY . .
ENV DATABASE_URL="mysql://build:build@localhost:3306/build"
RUN npm run build

# ---- Stage 2: runtime -------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    PORT=3000

# Copy the built app plus the full node_modules (the custom server and
# `prisma migrate deploy` at startup both need them).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# services/ and lib/ are needed as source because the settlement worker runs
# them directly via tsx (npm run worker).
COPY --from=builder /app/services ./services
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/server.js ./server.js

# Persistent uploads dir (mounted as a volume in compose).
RUN mkdir -p /app/public/uploads

COPY deploy/docker/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

# Entrypoint waits for the DB + runs migrations, then execs the CMD.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
