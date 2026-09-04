-- Final commercial plan limits requested for EduSphere.
-- Free Trial remains limited to 100 students / 15 staff / 1 campus,
-- but now expires after 1 day. Professional supports 800 students and
-- unlimited staff. Premium supports unlimited students and staff.

UPDATE "PlatformPlan"
SET "name" = 'Free Trial',
    "price" = 0,
    "currency" = 'PKR',
    "period" = '1 day',
    "maxStudents" = 100,
    "maxTeachers" = 15,
    "storageMb" = 1024,
    "supportTier" = 'Email',
    "features" = '["100 students","15 staff","1 campus","1-day free trial","Basic reports","Email support"]',
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE_TRIAL';

UPDATE "PlatformPlan"
SET "name" = 'Professional',
    "price" = 5000,
    "currency" = 'PKR',
    "period" = 'per month',
    "maxStudents" = 800,
    "maxTeachers" = 999999,
    "storageMb" = 10240,
    "supportTier" = 'Email + Chat',
    "features" = '["800 students","Unlimited staff","2 campuses","Full reports","Fee management","Email + Chat support"]',
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'PROFESSIONAL';

UPDATE "PlatformPlan"
SET "name" = 'Premium',
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
"currency" = 'PKR'
WHERE "plan" IN ('FREE_TRIAL', 'PROFESSIONAL', 'PREMIUM');

UPDATE "OnboardingPayment"
SET "amount" = CASE "plan"
  WHEN 'PROFESSIONAL' THEN 5000
  WHEN 'PREMIUM' THEN 10000
  ELSE "amount"
END
WHERE "plan" IN ('PROFESSIONAL', 'PREMIUM');

UPDATE "PlatformSetting"
SET "value" = 'FREE_TRIAL', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.defaultPlan';

UPDATE "PlatformSetting"
SET "value" = '1', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.trialDays';
