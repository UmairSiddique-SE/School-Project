-- Ensure a fresh production database receives the final EduSphere plan catalogue.
-- Existing plan rows are updated by the previous catalogue migration; these inserts
-- only fill missing rows and therefore do not delete or replace referenced data.

INSERT OR IGNORE INTO "PlatformPlan"
  ("id","planKey","name","price","currency","period","maxStudents","maxTeachers","storageMb","supportTier","features","isActive","createdAt","updatedAt")
VALUES
  ('plan-free-forever','FREE_TRIAL','Free Forever',0,'PKR','forever',100,15,1024,'Email','["100 students","15 staff","1 campus","Basic reports","Email support"]',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('plan-professional','PROFESSIONAL','Professional',5000,'PKR','per month',500,50,10240,'Email + Chat','["500 students","50 staff","2 campuses","Full reports","Fee management","Email + Chat support"]',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('plan-enterprise','PREMIUM','Enterprise',10000,'PKR','per month',999999,999999,512000,'Dedicated','["Unlimited students","Unlimited staff","5 campuses","All Professional features","Dedicated support"]',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

UPDATE "PlatformSetting"
SET "value" = 'FREE_TRIAL', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.defaultPlan';

UPDATE "PlatformSetting"
SET "value" = '0', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'subscription.trialDays';
