-- ============================================================
-- SEED: Platform Plans + Super Admin (idempotent)
-- ============================================================

-- 1. Platform Plans (upsert via ON CONFLICT)
INSERT INTO "PlatformPlan" (
  "id","planKey","name","price","currency","period",
  "maxStudents","maxTeachers","storageMb","supportTier","features","isActive",
  "createdAt","updatedAt"
)
VALUES
  (gen_random_uuid(),'FREE_TRIAL','Free Trial',0,'PKR','trial',
   20,15,1024,'Email',
   '["20 students","15 staff","1 campus","Core school management","Basic reports","Email support"]',
   true, NOW(), NOW()),
  (gen_random_uuid(),'PROFESSIONAL','Professional',3000,'PKR','per month',
   500,999999,10240,'Email + Chat',
   '["500 students","Unlimited staff","2 campuses","Full reports","Fee management","Email + Chat support"]',
   true, NOW(), NOW()),
  (gen_random_uuid(),'PREMIUM','Premium',5000,'PKR','per month',
   999999,999999,512000,'Dedicated',
   '["Unlimited students","Unlimited staff","5 campuses","500 GB storage","All Professional features","Priority support"]',
   true, NOW(), NOW())
ON CONFLICT ("planKey") DO UPDATE SET
  "name"       = EXCLUDED."name",
  "price"      = EXCLUDED."price",
  "currency"   = EXCLUDED."currency",
  "period"     = EXCLUDED."period",
  "maxStudents"= EXCLUDED."maxStudents",
  "maxTeachers"= EXCLUDED."maxTeachers",
  "storageMb"  = EXCLUDED."storageMb",
  "supportTier"= EXCLUDED."supportTier",
  "features"   = EXCLUDED."features",
  "isActive"   = EXCLUDED."isActive",
  "updatedAt"  = NOW();

-- Super Admin accounts are intentionally not seeded here. Bootstrap the first
-- platform administrator with `npm run admin:ensure` and deployment secrets.

