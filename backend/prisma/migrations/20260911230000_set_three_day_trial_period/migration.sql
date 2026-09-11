-- EduSphere Free Trial is exactly 3 days.
-- Keep both the plan period and platform setting aligned so registration
-- calculates the correct expiry and the Super Admin catalogue stays consistent.

UPDATE "PlatformPlan"
SET
  "period" = '3 days',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE_TRIAL';

UPDATE "PlatformSetting"
SET
  "value" = '3',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.trialDays';
