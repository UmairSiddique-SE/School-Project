-- Sync the Parent model with the PostgreSQL database.
-- fatherWhatsapp already exists in Prisma schema and service code.
ALTER TABLE "Parent"
ADD COLUMN IF NOT EXISTS "fatherWhatsapp" TEXT;
