-- Final EduSphere SaaS plan catalogue.
-- Keep FREE_TRIAL/PREMIUM keys for backward compatibility while exposing
-- the final customer-facing names Free Forever and Enterprise.

UPDATE "PlatformPlan"
SET "name" = 'Free Forever',
    "price" = 0,
    "currency" = 'PKR',
    "period" = 'forever',
    "maxStudents" = 100,
    "maxTeachers" = 15,
    "storageMb" = 1024,
    "supportTier" = 'Email',
    "features" = '["100 students","15 staff","1 campus","Basic reports","Email support"]'
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
    "features" = '["500 students","50 staff","2 campuses","Full reports","Fee management","Email + Chat support"]'
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
    "features" = '["Unlimited students","Unlimited staff","5 campuses","All Professional features","Dedicated support"]'
WHERE "planKey" = 'PREMIUM';

-- Keep subscription/payment records aligned with the final catalogue.
UPDATE "Subscription" SET "amount" = 0, "currency" = 'PKR' WHERE "plan" = 'FREE_TRIAL';
UPDATE "Subscription" SET "amount" = 5000, "currency" = 'PKR' WHERE "plan" = 'PROFESSIONAL';
UPDATE "Subscription" SET "amount" = 10000, "currency" = 'PKR' WHERE "plan" = 'PREMIUM';
UPDATE "OnboardingPayment" SET "amount" = 5000 WHERE "plan" = 'PROFESSIONAL';
UPDATE "OnboardingPayment" SET "amount" = 10000 WHERE "plan" = 'PREMIUM';
