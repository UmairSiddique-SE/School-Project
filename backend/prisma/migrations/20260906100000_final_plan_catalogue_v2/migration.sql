-- Final EduSphere launch catalogue.
-- Keeps the existing plan keys so existing subscriptions and payment history remain linked.

UPDATE "PlatformPlan"
SET "name" = 'Free Trial',
    "price" = 0,
    "currency" = 'PKR',
    "period" = 'free trial',
    "maxStudents" = 20,
    "maxTeachers" = 10,
    "storageMb" = 1024,
    "supportTier" = 'Email',
    "features" = '["Up to 20 students","Up to 10 staff","1 campus","Attendance & fees","Basic reports","Email support"]',
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE_TRIAL';

UPDATE "PlatformPlan"
SET "name" = 'Professional',
    "price" = 3000,
    "currency" = 'PKR',
    "period" = 'per month',
    "maxStudents" = 500,
    "maxTeachers" = 999999,
    "storageMb" = 10240,
    "supportTier" = 'Email + Chat',
    "features" = '["Up to 500 students","Unlimited staff","2 campuses","10 GB storage","Full reports","Fee management","Exams & results","Email + Chat support"]',
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'PROFESSIONAL';

UPDATE "PlatformPlan"
SET "name" = 'Premium',
    "price" = 5000,
    "currency" = 'PKR',
    "period" = 'per month',
    "maxStudents" = 999999,
    "maxTeachers" = 999999,
    "storageMb" = 512000,
    "supportTier" = 'Dedicated',
    "features" = '["Unlimited students","Unlimited staff","All modules","500 GB storage","School website","Custom domain","Advanced reports","Dedicated support"]',
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'PREMIUM';

UPDATE "Subscription"
SET "amount" = CASE "plan"
  WHEN 'FREE_TRIAL' THEN 0
  WHEN 'PROFESSIONAL' THEN 3000
  WHEN 'PREMIUM' THEN 5000
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
  WHEN 'PROFESSIONAL' THEN 3000
  WHEN 'PREMIUM' THEN 5000
  ELSE "amount"
END
WHERE "plan" IN ('PROFESSIONAL', 'PREMIUM');
