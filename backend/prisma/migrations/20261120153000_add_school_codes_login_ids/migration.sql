-- SchoolOS: persistent school codes and role-specific login IDs
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginId" TEXT;
ALTER TABLE "PendingSchoolRegistration" ADD COLUMN IF NOT EXISTS "schoolCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "School_code_key" ON "School"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "User_loginId_key" ON "User"("loginId");
