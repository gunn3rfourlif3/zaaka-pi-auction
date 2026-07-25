# Phase 5 Changes — Ratings, Notifications, Audit Log, Repo Cleanup

## ⚠️ Required step
The three new models add columns to the generated Prisma client. After pulling:
```bash
npx prisma generate      # regenerates client types (also run by CI + deploy.sh)
npx prisma migrate deploy # applies 20260725010000_phase5_...
```
Until `prisma generate` runs, `tsc` reports "Property 'reviews'/'notifications'/'audit_log'
does not exist on PrismaClient" — expected, and cleared by generation.

## 5.1 Ratings & reputation
- Schema: `reviews` (auction_id, rater_id, ratee_id, role, stars 1–5, comment), unique per counterpart/auction.
- API: `POST /api/reviews/create` (participant-only — server derives the counterpart from the
  escrow record, so you can only review the other party of an auction you completed);
  `GET /api/reviews/list?userId=` returns reviews + average/count.
- UI: `components/UserRating.tsx` (star badge) and `components/LeaveReviewModal.tsx`.

## 5.2 Notifications
- Schema: `notifications` (user_id, type, message, auction_id, read).
- Helper: `lib/notifications.ts` `notify()` — best-effort insert + Socket.IO push to `user_<id>`.
- Emit points: OUTBID (on new higher bid), WON + SOLD (on settlement), DELIVERY (on confirm-receipt), PAYOUT (on payout).
- API: `GET /api/notifications/list`, `POST /api/notifications/mark-read`.
- UI: `components/NotificationBell.tsx` (polls list; place in header when logged in).
- `server.js` gained a `join_user` socket handler for targeted pushes.

## 5.3 Audit log
- Schema: `audit_log` (event_type, actor, auction_id, amount, pi_payment_id, meta JSON).
- Helper: `lib/audit.ts` `audit()` — best-effort; pass a tx to write atomically.
- Write points: BID (complete), SETTLE (settlement_service), CONFIRM (confirm-receipt), PAYOUT (payout_service).
- API: `GET /api/admin/audit` (admin only; filter by auctionId/eventType).

## 5.4 Repo cleanup
- Removed duplicate files (`lib/prisma copy.ts`, `place_bid copy.ts`), ~17 dead root
  handlers, superseded alt servers (`production-server.js`, `server-new.js`), old cPanel
  scripts, ~14 root debug/test/fix scripts, ~27 transient markdown guides, 30 one-off
  scripts in `scripts/` (seed scripts kept), and the empty `src/`.
- Moved Vision-AI design docs to `docs/`.
- Added a real top-level `README.md`.

## Wiring the new UI (optional, when you touch index.tsx)
```tsx
import { NotificationBell } from '../components/NotificationBell';
import { UserRating } from '../components/UserRating';
import { LeaveReviewModal } from '../components/LeaveReviewModal';
// Header (logged in):      <NotificationBell />
// Seller display:          <UserRating userId={item.seller_id} />
// After a won auction:     <LeaveReviewModal auctionId={id} onClose={...} />
```
