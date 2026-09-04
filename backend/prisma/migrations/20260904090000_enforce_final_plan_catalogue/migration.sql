-- Enforce the final EduSphere SaaS catalogue without deleting referenced data.
-- This is safe for existing deployments and also corrects databases created from older defaults.

UPDATE "PlatformPlan"
SET "name" = 'Free Forever',
    "price" = 0,
    "currency" = 'PKR',
    "period" = 'forever',
    "maxStudents" = 100,
    "maxTeachers" = 15,
    "storageMb" = 1024,
    "supportTier" = 'Email',
    "features" = '["100 students","15 staff","1 campus","Basic reports","Email support"]',
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE_TRIAL';

UPDATE "PlatformPlan"
SET "name" = 'Professional',
    "price" = 5000,
    "currency" = 'PKR',
    "period" = 'per month',
    "maxStudents" = 500,
    "maxTeachers" = 50,
    "storageMb" = 10240,
    "supportTier" = 'Email + Chat',
    "features" = '["500 students","50 staff","2 campuses","Full reports","Fee management","Email + Chat support"]',
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'PROFESSIONAL';

UPDATE "PlatformPlan"
SET "name" = 'Enterprise',
    "price" = 10000,
    "currency" = 'PKR',
    "period" = 'per month',
    "maxStudents" = 999999,
    "maxTeachers" = 999999,
    "storageMb" = 512000,
    "supportTier" = 'Dedicated',
    "features" = '["Unlimited students","Unlimited staff","5 campuses","All Professional features","Dedicated support"]',
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'PREMIUM';

UPDATE "Subscription"
SET "amount" = CASE "plan"
  WHEN 'FREE_TRIAL' THEN 0
  WHEN 'PROFESSIONAL' THEN 5000
  WHEN 'PREMIUM' THEN 10000
  ELSE "amount"
END,
"currency" = CASE "plan"
  WHEN 'FREE_TRIAL' THEN 'PKR'
  WHEN 'PROFESSIONAL' THEN 'PKR'
  WHEN 'PREMIUM' THEN 'PKR'
  ELSE "currency"
END
WHERE "plan" IN ('FREE_TRIAL', 'PROFESSIONAL', 'PREMIUM');

UPDATE "OnboardingPayment"
SET "amount" = CASE "plan"
  WHEN 'PROFESSIONAL' THEN 5000
  WHEN 'PREMIUM' THEN 10000
  ELSE "amount"
END
WHERE "plan" IN ('PROFESSIONAL', 'PREMIUM');

-- New registrations use Free Forever rather than a time-limited trial.
UPDATE "PlatformSetting"
SET "value" = 'FREE_TRIAL', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.defaultPlan';

UPDATE "PlatformSetting"
SET "value" = '0', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.trialDays';
