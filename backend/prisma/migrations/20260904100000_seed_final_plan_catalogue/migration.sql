-- Final EduSphere plan catalogue migration.
-- Plan rows are already created/handled by the previous catalogue migration.
-- This migration only ensures the default subscription settings are updated.
UPDATE "PlatformSetting"
SET "value" = 'FREE_TRIAL',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.defaultPlan';
UPDATE "PlatformSetting"
SET "value" = '0',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.trialDays';