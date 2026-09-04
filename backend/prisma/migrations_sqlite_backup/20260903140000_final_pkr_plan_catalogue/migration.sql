-- Consolidate legacy Basic/Standard subscriptions under the final Professional plan.
UPDATE "Subscription" SET "plan" = 'PROFESSIONAL', "amount" = 3000, "currency" = 'PKR'
WHERE "plan" IN ('BASIC', 'STANDARD');
UPDATE "OnboardingPayment" SET "plan" = 'PROFESSIONAL', "amount" = 3000
WHERE "plan" IN ('BASIC', 'STANDARD');
UPDATE "SchoolRequest" SET "requestedPlan" = 'PROFESSIONAL'
WHERE "requestedPlan" IN ('BASIC', 'STANDARD');

DELETE FROM "PlatformPlan" WHERE "planKey" = 'STANDARD';
UPDATE "PlatformPlan" SET "planKey" = 'PROFESSIONAL', "name" = 'Professional', "price" = 3000, "currency" = 'PKR'
WHERE "planKey" = 'BASIC';
UPDATE "PlatformPlan" SET "name" = 'Premium', "price" = 5000, "currency" = 'PKR'
WHERE "planKey" = 'PREMIUM';
UPDATE "PlatformPlan" SET "name" = 'Free Trial', "price" = 0, "currency" = 'PKR'
WHERE "planKey" = 'FREE_TRIAL';
