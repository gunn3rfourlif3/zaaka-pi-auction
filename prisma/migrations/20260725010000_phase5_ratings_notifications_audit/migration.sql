-- Phase 5: ratings/reviews, in-app notifications, and money-event audit log.
-- Hand-authored to match prisma/schema.prisma (engine binaries unavailable to
-- generate automatically). Applied by `prisma migrate deploy`.

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `auction_id` INTEGER NOT NULL,
    `rater_id` VARCHAR(255) NOT NULL,
    `ratee_id` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `stars` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_auction_id_rater_id_ratee_id_key` (`auction_id`, `rater_id`, `ratee_id`),
    INDEX `reviews_ratee_id_idx` (`ratee_id`),
    INDEX `reviews_auction_id_idx` (`auction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `auction_id` INTEGER NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_idx` (`user_id`),
    INDEX `notifications_read_idx` (`read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_type` VARCHAR(50) NOT NULL,
    `actor` VARCHAR(255) NULL,
    `auction_id` INTEGER NULL,
    `amount` DECIMAL(10, 2) NULL,
    `pi_payment_id` VARCHAR(255) NULL,
    `meta` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_auction_id_idx` (`auction_id`),
    INDEX `audit_log_event_type_idx` (`event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_auction_id_fkey`
    FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
