-- Keep legacy plan rows for historical references, but make Professional the only
-- active subscription. Existing subscriptions and payment records are preserved.
UPDATE "PlatformPlan"
SET
  "maxStudents" = 999999,
  "features" = '["Unlimited students","Unlimited staff","All SchoolOS modules","Full reports","Fee management","10 GB storage","Email + Chat support"]',
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'PROFESSIONAL';

UPDATE "PlatformPlan"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" IN ('FREE_TRIAL', 'PREMIUM');

UPDATE "PlatformSetting"
SET "value" = 'PROFESSIONAL', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.defaultPlan';
