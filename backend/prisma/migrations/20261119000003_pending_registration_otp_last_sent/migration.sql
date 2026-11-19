ALTER TABLE "PendingSchoolRegistration"
  ADD COLUMN IF NOT EXISTS "otpLastSentAt" TIMESTAMP(3);

UPDATE "PendingSchoolRegistration"
SET "otpLastSentAt" = COALESCE("otpLastSentAt", "createdAt")
WHERE "otpLastSentAt" IS NULL;
