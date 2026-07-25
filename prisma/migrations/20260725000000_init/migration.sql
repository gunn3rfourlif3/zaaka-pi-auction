-- Baseline (init) migration for Pi Auctions — hand-authored to match
-- prisma/schema.prisma exactly, because the engine binaries were unavailable
-- to generate it automatically. Verify with `prisma migrate status` after use.
--
-- FRESH database:    `prisma migrate deploy` runs this to create all tables.
-- EXISTING database: DO NOT run this. Instead baseline it once:
--     npx prisma migrate resolve --applied 20260725000000_init
--   then apply prisma/manual_migration_phase2.sql for the pi_payment_id
--   unique index if it isn't already present.

-- CreateTable
CREATE TABLE `auctions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `currentBid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `seller_id` VARCHAR(255) NOT NULL,
    `category` VARCHAR(191) NULL DEFAULT 'General',
    `status` VARCHAR(50) NULL DEFAULT 'OPEN',
    `delivered` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expires_at` DATETIME(3) NOT NULL,
    `starts_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auction_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` TEXT NOT NULL,
    `auctionId` INTEGER NOT NULL,

    INDEX `auction_images_auctionId_idx` (`auctionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bids` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(10, 2) NOT NULL,
    `bidder_id` VARCHAR(191) NOT NULL,
    `pi_payment_id` VARCHAR(255) NULL,
    `auctionId` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bids_pi_payment_id_key` (`pi_payment_id`),
    INDEX `bids_auctionId_idx` (`auctionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `escrow_ledger` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_status` VARCHAR(50) NOT NULL,
    `payout_status` VARCHAR(50) NULL DEFAULT 'PENDING',
    `pi_payment_id` VARCHAR(255) NULL,
    `auction_id` INTEGER NOT NULL,
    `winner_id` VARCHAR(255) NOT NULL,
    `seller_id` VARCHAR(255) NOT NULL,

    INDEX `auction_id` (`auction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sender_id` VARCHAR(255) NOT NULL,
    `receiver_id` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `auction_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read` BOOLEAN NOT NULL DEFAULT false,

    INDEX `messages_auction_id_idx` (`auction_id`),
    INDEX `messages_sender_id_idx` (`sender_id`),
    INDEX `messages_receiver_id_idx` (`receiver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auto_bids` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `auction_id` INTEGER NOT NULL,
    `bidder_id` VARCHAR(255) NOT NULL,
    `max_amount` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `auto_bids_auction_id_idx` (`auction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auction_images` ADD CONSTRAINT `auction_images_auctionId_fkey`
    FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bids` ADD CONSTRAINT `bids_auctionId_fkey`
    FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `escrow_ledger` ADD CONSTRAINT `escrow_ledger_ibfk_1`
    FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_auction_id_fkey`
    FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auto_bids` ADD CONSTRAINT `auto_bids_auction_id_fkey`
    FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
