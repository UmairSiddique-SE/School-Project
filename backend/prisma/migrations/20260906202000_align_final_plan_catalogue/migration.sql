-- Final EduSphere public plan catalogue.
-- Upserts keep existing plan IDs where possible and also repair older seeded values.

INSERT INTO "PlatformPlan"
  ("id","planKey","name","price","currency","period","maxStudents","maxTeachers","storageMb","supportTier","features","isActive","createdAt","updatedAt")
VALUES
  ('plan-free-trial','FREE_TRIAL','Free Trial',0,'PKR','Free trial',20,10,1024,'Email','["Up to 20 students","Up to 10 staff","Core modules","Attendance","Fees & Exams","Basic reports","Email support"]',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('plan-professional','PROFESSIONAL','Professional',3000,'PKR','per month',500,999999,10240,'Email + Chat','["Up to 500 students","Unlimited staff","All modules","Advanced reports","Fee management","School website","Custom branding","Email + Chat support"]',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('plan-premium','PREMIUM','Premium',5000,'PKR','per month',999999,999999,512000,'Dedicated','["Unlimited students","Unlimited staff","All modules","Advanced reports","School website","Custom branding","Custom domain","Dedicated support"]',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
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
