-- Repair SchoolRequest columns for PostgreSQL databases created from older migrations.
-- All statements are idempotent so existing installations are safe.
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "ownerName" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "expectedStudents" INTEGER;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "subdomain" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "requestedPlan" TEXT NOT NULL DEFAULT 'FREE_TRIAL';
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SchoolRequest" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "SchoolRequest_status_idx" ON "SchoolRequest"("status");
CREATE INDEX IF NOT EXISTS "SchoolRequest_createdAt_idx" ON "SchoolRequest"("createdAt");
