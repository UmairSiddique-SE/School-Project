-- Final EduSphere SaaS plan catalogue.
-- Keep legacy plan keys for API compatibility; customer-facing names are final.

DELETE FROM "PlatformPlan";

INSERT INTO "PlatformPlan"
  ("id","planKey","name","price","currency","period","maxStudents","maxTeachers","storageMb","supportTier","features")
VALUES
  ('plan-free-forever','FREE_TRIAL','Free Forever',0,'PKR','forever',100,15,1024,'Email','["100 students","15 staff","1 campus","Basic reports","Email support"]'),
  ('plan-professional','PROFESSIONAL','Professional',5000,'PKR','per month',500,50,10240,'Email + Chat','["500 students","50 staff","2 campuses","Full reports","Fee management","Email + Chat support"]'),
  ('plan-enterprise','PREMIUM','Enterprise',10000,'PKR','per month',999999,999999,512000,'Dedicated','["Unlimited students","Unlimited staff","5 campuses","All Professional features","Dedicated support"]');

-- Keep subscription/payment records aligned with the final catalogue.
UPDATE "Subscription" SET "amount" = 0, "currency" = 'PKR' WHERE "plan" = 'FREE_TRIAL';
UPDATE "Subscription" SET "amount" = 5000, "currency" = 'PKR' WHERE "plan" = 'PROFESSIONAL';
UPDATE "Subscription" SET "amount" = 10000, "currency" = 'PKR' WHERE "plan" = 'PREMIUM';
UPDATE "OnboardingPayment" SET "amount" = 5000 WHERE "plan" = 'PROFESSIONAL';
UPDATE "OnboardingPayment" SET "amount" = 10000 WHERE "plan" = 'PREMIUM';
