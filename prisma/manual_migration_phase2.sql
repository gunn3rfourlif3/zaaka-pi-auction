-- ============================================================================
-- Phase 2 data-integrity migration for Pi Auctions (MySQL)
-- ----------------------------------------------------------------------------
-- Apply this ONCE against the production database. Prefer generating a proper
-- Prisma migration from this schema change, but this SQL is provided so the
-- constraint can be added even where migration history has not been baselined.
--
--   Recommended (proper) path:
--     npx prisma migrate diff \
--       --from-schema-datasource prisma/schema.prisma \
--       --to-schema-datamodel  prisma/schema.prisma \
--       --script > prisma/migrations/<timestamp>_phase2/migration.sql
--     npx prisma migrate deploy
--
--   Direct path (if you must):
--     mysql -u <user> -p <db> < prisma/manual_migration_phase2.sql
-- ============================================================================

-- 1. Remove any pre-existing duplicate pi_payment_id rows BEFORE adding the
--    unique index (keep the earliest bid per payment id). Review before running.
-- DELETE b1 FROM bids b1
--   INNER JOIN bids b2
--   ON b1.pi_payment_id = b2.pi_payment_id
--   AND b1.pi_payment_id IS NOT NULL
--   AND b1.id > b2.id;

-- 2. Enforce one bid per Pi payment id (NULLs are allowed and unaffected).
ALTER TABLE `bids`
  ADD UNIQUE INDEX `bids_pi_payment_id_key` (`pi_payment_id`);

-- 3. Helpful index for per-auction bid lookups (safe if it already exists —
--    drop the line if MySQL reports a duplicate key name).
-- ALTER TABLE `bids` ADD INDEX `bids_auctionId_idx` (`auctionId`);
