-- Repair SchoolRequest columns that may be missing from databases where the
-- previous synchronization migration was marked as applied without running.
-- This migration is intentionally idempotent.
ALTER TABLE "SchoolRequest"
  ADD COLUMN IF NOT EXISTS "ownerName" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "expectedStudents" INTEGER,
  ADD COLUMN IF NOT EXISTS "subdomain" TEXT,
  ADD COLUMN IF NOT EXISTS "requestedPlan" TEXT DEFAULT 'FREE_TRIAL',
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "SchoolRequest"
SET "ownerName" = COALESCE(NULLIF("ownerName", ''), 'School Administrator'),
    "requestedPlan" = COALESCE(NULLIF("requestedPlan", ''), 'FREE_TRIAL'),
    "status" = COALESCE(NULLIF("status", ''), 'PENDING'),
    "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

ALTER TABLE "SchoolRequest"
  ALTER COLUMN "ownerName" SET NOT NULL,
  ALTER COLUMN "requestedPlan" SET NOT NULL,
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "SchoolRequest_subdomain_idx" ON "SchoolRequest"("subdomain");
