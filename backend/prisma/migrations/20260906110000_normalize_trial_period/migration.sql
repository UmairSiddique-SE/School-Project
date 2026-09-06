-- The application calculates trial expiry from the plan period.
-- Keep the public label functional by storing an explicit duration.
UPDATE "PlatformPlan"
SET "period" = '1 day',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE_TRIAL';

UPDATE "PlatformSetting"
SET "value" = '1'
WHERE "key" = 'subscription.trialDays';
