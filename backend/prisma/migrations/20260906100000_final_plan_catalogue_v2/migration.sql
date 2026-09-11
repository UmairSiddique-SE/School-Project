-- Final EduSphere launch catalogue
-- Existing plan keys preserved so subscriptions/payment history remain linked.
-- PostgreSQL / Neon migration
INSERT INTO "PlatformPlan" (
  "id",
  "planKey",
  "name",
  "price",
  "currency",
  "period",
  "maxStudents",
  "maxTeachers",
  "storageMb",
  "supportTier",
  "features",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'FREE_TRIAL',
  'FREE_TRIAL',
  'Free Trial',
  0,
  'PKR',
  'free trial',
  20,
  15,
  1024,
  'Email',
  '["Up to 20 students","Up to 15 staff","1 campus","Attendance & fees","Basic reports","Email support"]',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'PROFESSIONAL',
  'PROFESSIONAL',
  'Professional',
  3000,
  'PKR',
  'per month',
  500,
  999999,
  10240,
  'Email + Chat',
  '["Up to 500 students","Unlimited staff","2 campuses","10 GB storage","Full reports","Fee management","Exams & results","Email + Chat support"]',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'PREMIUM',
  'PREMIUM',
  'Premium',
  5000,
  'PKR',
  'per month',
  999999,
  999999,
  512000,
  'Dedicated',
  '["Unlimited students","Unlimited staff","All modules","500 GB storage","School website","Custom domain","Advanced reports","Dedicated support"]',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("planKey") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price" = EXCLUDED."price",
  "currency" = EXCLUDED."currency",
  "period" = EXCLUDED."period",
  "maxStudents" = EXCLUDED."maxStudents",
  "maxTeachers" = EXCLUDED."maxTeachers",
  "storageMb" = EXCLUDED."storageMb",
  "supportTier" = EXCLUDED."supportTier",
  "features" = EXCLUDED."features",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;


-- Update existing subscriptions
UPDATE "Subscription"
SET
  "amount" = CASE "plan"
    WHEN 'FREE_TRIAL' THEN 0
    WHEN 'PROFESSIONAL' THEN 3000
    WHEN 'PREMIUM' THEN 5000
    ELSE "amount"
  END,
  "currency" = 'PKR'
WHERE "plan" IN (
  'FREE_TRIAL',
  'PROFESSIONAL',
  'PREMIUM'
);


-- Update onboarding payment amounts
UPDATE "OnboardingPayment"
SET
  "amount" = CASE "plan"
    WHEN 'PROFESSIONAL' THEN 3000
    WHEN 'PREMIUM' THEN 5000
    ELSE "amount"
  END
WHERE "plan" IN (
  'PROFESSIONAL',
  'PREMIUM'
);