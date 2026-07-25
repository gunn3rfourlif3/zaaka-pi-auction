# Zaaka Pi Auction

A peer-to-peer auction marketplace where bids are paid in **Pi**. The platform
holds the winning payment in escrow and releases it to the seller once the buyer
confirms delivery.

## Tech stack

- **Next.js 14** (Pages Router) + **React 18** + **TypeScript**
- **Prisma 5** ORM over **MySQL**
- **Pi Platform API** + **Stellar SDK** for on-chain settlement (U2A) and payout (A2U)
- **Socket.IO** for live bid updates, served by a custom `server.js`
- **Tailwind CSS**, lucide-react, SweetAlert2

## Getting started (local dev)

```bash
cp .env.example .env        # fill in DB + sandbox Pi credentials
npm install
npx prisma generate
npx prisma migrate deploy    # or: npx prisma db push, for a scratch DB
npm run dev                  # Next dev server
```

Run the production server (Next + Socket.IO) locally:

```bash
npm run build && npm start   # start = node server.js
```

## Environment

Copy `.env.example` (dev) or `.env.production.example` (prod) and fill in. Key vars:
`DATABASE_URL`, `PI_API_KEY`, `PI_CLIENT_SECRET`, `PI_WALLET_SEED`,
`SESSION_SECRET`, `CRON_SECRET`, `ADMIN_UIDS`, `ALLOWED_ORIGINS`.
**Never commit real secrets** — see `PHASE_0-2_CHANGES.md`.

## Project layout

```
pages/            Next pages + API routes (pages/api/**)
components/       React components (dashboards, modals, ratings, notifications)
lib/              auth, prisma client, Pi API, rate limiting, notifications, audit
services/         auction engine, settlement, payout, auto-bid, notifications
prisma/           schema + migrations + seed
deploy/           VPS deployment (Nginx, PM2, systemd, deploy & smoke-test scripts)
docs/             design docs (Vision-AI plans)
scripts/          database seeding scripts
```

## Key API routes

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/auth/pi-login` | — | Exchange Pi accessToken for a session cookie |
| `POST /api/auctions/create` | user | Create an auction (seller = session) |
| `POST /api/payments/approve` · `complete` | user | Bid approval + completion (Pi) |
| `POST /api/auctions/settle` | admin | Manual settlement |
| `POST /api/auctions/confirm-receipt` | winner | Confirm delivery → release funds |
| `POST /api/cron/settle-expired` | CRON_SECRET | Settle expired auctions |
| `POST /api/reviews/create` · `GET /list` | user / — | Ratings & reputation |
| `GET /api/notifications/list` · `POST /mark-read` | user | In-app notifications |
| `GET /api/admin/audit` | admin | Money-event audit trail |

## Deployment

Two supported paths:
- **Docker (recommended):** `deploy/docker/README.md` — `docker compose up` runs
  app + MySQL + settlement worker. Migrations apply automatically on start.
- **Bare VPS:** `deploy/README.md` — Ubuntu + Nginx + PM2 + MySQL, TLS,
  automated settlement, CI/CD, and the post-deploy smoke test.

## Security & hardening

Authentication, payment integrity, rate limiting, and the production hardening
history are documented in **`PHASE_0-2_CHANGES.md`**. Run `deploy/smoke-test.sh`
against a running instance to verify the controls are active.
