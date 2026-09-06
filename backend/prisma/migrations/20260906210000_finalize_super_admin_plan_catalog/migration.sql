-- Finalize the customer-facing SaaS catalogue used by the Super Admin.
-- This migration is idempotent and updates existing rows as well as fresh databases.

UPDATE "PlatformPlan"
SET
  "name" = 'Free Trial',
  "price" = 0,
  "currency" = 'PKR',
  "period" = 'trial',
  "maxStudents" = 20,
  "maxTeachers" = 15,
  "storageMb" = 1024,
  "supportTier" = 'Email',
  "features" = '["20 students","15 staff","1 campus","Core school management","Basic reports","Email support"]',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE_TRIAL';

UPDATE "PlatformPlan"
SET
  "name" = 'Professional',
  "price" = 3000,
  "currency" = 'PKR',
  "period" = 'per month',
  "maxStudents" = 500,
  "maxTeachers" = 999999,
  "storageMb" = 10240,
  "supportTier" = 'Email + Chat',
  "features" = '["500 students","Unlimited staff","2 campuses","Full reports","Fee management","Email + Chat support"]',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'PROFESSIONAL';

UPDATE "PlatformPlan"
SET
  "name" = 'Premium',
  "price" = 5000,
  "currency" = 'PKR',
  "period" = 'per month',
  "maxStudents" = 999999,
  "maxTeachers" = 999999,
  "storageMb" = 512000,
  "supportTier" = 'Dedicated',
  "features" = '["Unlimited students","Unlimited staff","5 campuses","500 GB storage","All Professional features","Priority support"]',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'PREMIUM';
