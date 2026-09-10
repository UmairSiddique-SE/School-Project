-- Final EduSphere launch catalogue.
-- Uses the existing plan keys so subscriptions and payment history remain linked.
-- Upserts are included so a fresh production database gets the same catalogue before the app starts.

INSERT INTO "PlatformPlan" ("planKey", "name", "price", "currency", "period", "maxStudents", "maxTeachers", "storageMb", "supportTier", "features", "isActive", "updatedAt")
VALUES
('FREE_TRIAL', 'Free Trial', 0, 'PKR', 'free trial', 20, 15, 1024, 'Email', '["Up to 20 students","Up to 15 staff","1 campus","Attendance & fees","Basic reports","Email support"]', true, CURRENT_TIMESTAMP),
('PROFESSIONAL', 'Professional', 3000, 'PKR', 'per month', 500, 999999, 10240, 'Email + Chat', '["Up to 500 students","Unlimited staff","2 campuses","10 GB storage","Full reports","Fee management","Exams & results","Email + Chat support"]', true, CURRENT_TIMESTAMP),
('PREMIUM', 'Premium', 5000, 'PKR', 'per month', 999999, 999999, 512000, 'Dedicated', '["Unlimited students","Unlimited staff","All modules","500 GB storage","School website","Custom domain","Advanced reports","Dedicated support"]', true, CURRENT_TIMESTAMP)
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
