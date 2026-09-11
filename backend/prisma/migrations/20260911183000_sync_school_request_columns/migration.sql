-- Synchronize SchoolRequest with the current Prisma model.
-- This is intentionally idempotent because existing databases may have an older
-- SchoolRequest table with only a subset of the current columns.

ALTER TABLE "SchoolRequest"
  ADD COLUMN IF NOT EXISTS "ownerName" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
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

-- Existing rows need valid values before Prisma treats required fields as NOT NULL.
UPDATE "SchoolRequest"
SET "ownerName" = COALESCE(NULLIF("ownerName", ''), 'School Administrator')
WHERE "ownerName" IS NULL OR "ownerName" = '';

UPDATE "SchoolRequest"
SET "requestedPlan" = COALESCE(NULLIF("requestedPlan", ''), 'FREE_TRIAL')
WHERE "requestedPlan" IS NULL OR "requestedPlan" = '';

UPDATE "SchoolRequest"
SET "status" = COALESCE(NULLIF("status", ''), 'PENDING')
WHERE "status" IS NULL OR "status" = '';

UPDATE "SchoolRequest"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "createdAt" IS NULL;

UPDATE "SchoolRequest"
SET "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;

ALTER TABLE "SchoolRequest"
  ALTER COLUMN "ownerName" SET NOT NULL,
  ALTER COLUMN "requestedPlan" SET NOT NULL,
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "SchoolRequest_subdomain_idx" ON "SchoolRequest"("subdomain");
