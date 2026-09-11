-- Keep SchoolRequest compatible with the current Prisma model.
-- These columns were added to schema.prisma after the original table migration.
ALTER TABLE "SchoolRequest"
  ADD COLUMN IF NOT EXISTS "expectedStudents" INTEGER,
  ADD COLUMN IF NOT EXISTS "subdomain" TEXT;

CREATE INDEX IF NOT EXISTS "SchoolRequest_subdomain_idx" ON "SchoolRequest"("subdomain");
