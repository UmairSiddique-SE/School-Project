-- Final EduSphere SaaS plan catalogue.
-- Keep legacy plan keys for API compatibility; customer-facing names are final.

DELETE FROM "PlatformPlan";
INSERT INTO "PlatformPlan"
  ("id","planKey","name","price","currency","period","maxStudents","maxTeachers","storageMb","supportTier","features","updatedAt")
VALUES
  ('plan-free-forever','FREE_TRIAL','Free Forever',0,'PKR','forever',100,15,1024,'Email','["100 students","15 staff","1 campus","Basic reports","Email support"]',CURRENT_TIMESTAMP),
  ('plan-professional','PROFESSIONAL','Professional',5000,'PKR','per month',500,50,10240,'Email + Chat','["500 students","50 staff","2 campuses","Full reports","Fee management","Email + Chat support"]',CURRENT_TIMESTAMP),
  ('plan-enterprise','PREMIUM','Enterprise',10000,'PKR','per month',999999,999999,512000,'Dedicated','["Unlimited students","Unlimited staff","5 campuses","All Professional features","Dedicated support"]',CURRENT_TIMESTAMP);