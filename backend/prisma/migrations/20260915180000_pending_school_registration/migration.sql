CREATE TABLE IF NOT EXISTS "PendingSchoolRegistration" (
  "id" TEXT NOT NULL,
  "schoolName" TEXT NOT NULL,
  "schoolSlug" TEXT NOT NULL,
  "schoolType" TEXT NOT NULL,
  "logoUrl" TEXT NOT NULL,
  "schoolAddress" TEXT NOT NULL,
  "schoolPhone" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "adminName" TEXT NOT NULL,
  "adminEmail" TEXT NOT NULL,
  "adminPhone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "requestedPlan" TEXT NOT NULL DEFAULT 'FREE_TRIAL',
  "otp" TEXT NOT NULL,
  "otpExpiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PendingSchoolRegistration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PendingSchoolRegistration_schoolSlug_key" ON "PendingSchoolRegistration"("schoolSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "PendingSchoolRegistration_adminEmail_key" ON "PendingSchoolRegistration"("adminEmail");
CREATE INDEX IF NOT EXISTS "PendingSchoolRegistration_otpExpiresAt_idx" ON "PendingSchoolRegistration"("otpExpiresAt");
CREATE INDEX IF NOT EXISTS "PendingSchoolRegistration_createdAt_idx" ON "PendingSchoolRegistration"("createdAt");