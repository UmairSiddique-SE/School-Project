-- Store platform plan pricing in the same currency as subscriptions.
ALTER TABLE "PlatformPlan" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PKR';

-- Replace the legacy USD defaults with the platform's PKR catalogue.
UPDATE "PlatformPlan" SET "price" = 5000, "currency" = 'PKR' WHERE "planKey" = 'BASIC';
UPDATE "PlatformPlan" SET "price" = 10000, "currency" = 'PKR' WHERE "planKey" = 'STANDARD';
UPDATE "PlatformPlan" SET "price" = 20000, "currency" = 'PKR' WHERE "planKey" = 'PREMIUM';
UPDATE "PlatformPlan" SET "currency" = 'PKR' WHERE "planKey" = 'FREE_TRIAL';

-- Existing subscriptions belong to the Pakistan platform as well.
UPDATE "Subscription" SET "currency" = 'PKR' WHERE "currency" = 'USD';
