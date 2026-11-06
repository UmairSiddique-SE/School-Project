-- Normalize plan periods so approval and subscription lifecycle logic always receives supported values.
UPDATE "PlatformPlan"
SET "period" = 'trial', "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE_TRIAL';

UPDATE "PlatformPlan"
SET "period" = 'per month', "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" IN ('PROFESSIONAL', 'PREMIUM');

-- Repair legacy aliases that may exist on any non-catalogue plan rows.
UPDATE "PlatformPlan"
SET "period" = 'per month', "updatedAt" = CURRENT_TIMESTAMP
WHERE LOWER(TRIM("period")) IN ('monthly', 'month', 'per_month', '1 month', '1 month(s)');
