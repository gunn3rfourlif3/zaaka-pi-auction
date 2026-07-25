# Phase 0–2 Production-Hardening Changes

This document summarizes the security and correctness changes applied to the
codebase and the **manual steps you must still perform** before deploying.

---

## ⚠️ Manual steps required (do these before going live)

1. **Rotate every credential** that was ever committed (they are compromised):
   - Regenerate the **Pi API key** and **Pi client secret** in the Pi Developer Portal.
   - Generate a **new payout wallet** and move funds; treat the old `PI_WALLET_SEED` as burned.
   - Set a new **database password**.
2. **Set the new environment variables** (see `.env.production.example`):
   - `SESSION_SECRET` — 32+ byte random hex (`openssl rand -hex 32`). Required in production.
   - `CRON_SECRET` — random hex; sent as a Bearer token by the settlement scheduler.
   - `ADMIN_UIDS` — comma-separated Pi UIDs/usernames allowed to hit admin/settlement routes.
3. **Purge secrets from git history** (`git filter-repo` or BFG), then force-push, so old keys aren't recoverable from clones.
4. **Reinstall dependencies** — `pg` and `@prisma/adapter-pg` (unused Postgres packages) were removed:
   `npm install` (updates the lockfile).
5. **Apply the DB migration** — add the unique index on `bids.pi_payment_id`:
   - Preferred: baseline a Prisma migration and `npx prisma migrate deploy`.
   - Or run `prisma/manual_migration_phase2.sql` (review the de-dupe step first).
6. **Update the cron job** to send `Authorization: Bearer $CRON_SECRET` when calling `/api/cron/settle-expired`.

---

## What changed

### Phase 0 — Secrets & environment
- `.env.production.example` scrubbed to placeholders; new required vars documented.
- Added `.env.example` for local development.
- `.gitignore` expanded to cover `.env*`, build output, and logs.

### Phase 1 — Security hardening
- **New `lib/auth.ts`** — verifies the Pi access token against `api.minepi.com/v2/me`,
  then issues an HMAC-signed, HttpOnly session cookie. Helpers: `requireAuth`,
  `requireAdmin`, `isAdmin`, `getSession`, `verifyPiAccessToken`.
- **New routes** `POST /api/auth/pi-login` and `POST /api/auth/logout`.
- **Frontend** (`pages/index.tsx`) now posts the Pi `accessToken` to `/api/auth/pi-login`
  after `Pi.authenticate` (both auto-login and manual), and calls `/api/auth/logout` on logout.
- **Protected routes** (now require a verified session):
  - `payments/complete`, `payments/approve` — real-payment paths.
  - `auctions/create` — seller identity now taken from the session, **not** the request body.
  - `messages/send` — sender identity taken from the session.
  - `auctions/confirm-receipt` — only the winning buyer (or an admin) may confirm.
  - `auctions/settle` — **admin only**.
  - `cron/settle-expired` — requires the `CRON_SECRET` Bearer token.
- **Mock-payment bypasses disabled in production** (`NODE_ENV === 'production'`) across
  `payments/complete`, `payments/approve`, `lib/pi_api.ts`, and the frontend bid handler.
- **`next.config.js`** rewritten: strict CSP scoped to own origin + Pi domains, removed the
  wildcard CORS / `X-Frame-Options: ALLOWALL` / ngrok headers, added HSTS, `nosniff`,
  `Referrer-Policy`, and `Permissions-Policy`. Ngrok origins removed from server actions.
- **New `lib/rateLimit.ts`** — in-memory limiter applied to login and bidding
  (back with Redis for multi-process scale).

### Phase 2 — Correctness & data integrity
- **Bid validation** — `payments/complete` now enforces strictly-increasing bids
  (minimum increment) inside the DB transaction, using the Pi-verified amount only.
- **Idempotency** — duplicate `pi_payment_id` callbacks no longer double-record;
  backed by a new `@unique` constraint in the schema.
- **Prisma singleton** — `payments/complete` and `settlement_service` now use the shared
  `lib/prisma` client instead of instantiating their own (avoids pool exhaustion).
- **Anti-sniping repaired** — `auction_engine` now checks the real `OPEN` status and emits
  `clock_extended`; wired into the bid-completion flow.
- **Removed unused Postgres packages** (`pg`, `@prisma/adapter-pg`) — schema is MySQL.

---

## Notes / follow-ups (later phases)
- The whole-repo git diff shows line-ending (CRLF→LF) churn from the environment; the
  *semantic* changes are limited to the files listed above. Consider adding a
  `.gitattributes` (`* text=auto eol=lf`) to normalize once.
- Rate limiting and real-time are process-local; move both to Redis when scaling past one PM2 worker.
- Confirm the refund path for out-bid losing bidders (Phase 1.3 item to verify).
- The custom `server.js` still has a hardcoded static path and CORS list — parameterize during Phase 3 VPS setup.
