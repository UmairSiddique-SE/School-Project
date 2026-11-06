-- The Building/Room Prisma models pre-date the current migration chain on some
-- databases. Keep this migration idempotent so existing installations are safe.

CREATE TABLE IF NOT EXISTS "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "buildingType" TEXT NOT NULL DEFAULT 'OWNED',
    "address" TEXT,
    "city" TEXT,
    "locationArea" TEXT,
    "floors" INTEGER NOT NULL DEFAULT 1,
    "totalClassrooms" INTEGER NOT NULL DEFAULT 0,
    "totalRooms" INTEGER NOT NULL DEFAULT 0,
    "studentCapacity" INTEGER NOT NULL DEFAULT 0,
    "hasComputerLab" BOOLEAN NOT NULL DEFAULT false,
    "hasScienceLab" BOOLEAN NOT NULL DEFAULT false,
    "hasLibrary" BOOLEAN NOT NULL DEFAULT false,
    "hasPlayground" BOOLEAN NOT NULL DEFAULT false,
    "hasAuditorium" BOOLEAN NOT NULL DEFAULT false,
    "hasCanteen" BOOLEAN NOT NULL DEFAULT false,
    "hasPrayerArea" BOOLEAN NOT NULL DEFAULT false,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "hasCctv" BOOLEAN NOT NULL DEFAULT false,
    "hasSecurityGuard" BOOLEAN NOT NULL DEFAULT false,
    "hasFireSafety" BOOLEAN NOT NULL DEFAULT false,
    "hasFirstAid" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "Building_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Building_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Building_schoolId_idx" ON "Building"("schoolId");

CREATE TABLE IF NOT EXISTS "Room" (
    "id" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "name" TEXT,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "type" TEXT NOT NULL DEFAULT 'CLASSROOM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "buildingId" TEXT NOT NULL,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Room_buildingId_fkey"
      FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Room_roomNo_buildingId_key" ON "Room"("roomNo", "buildingId");
CREATE INDEX IF NOT EXISTS "Room_buildingId_idx" ON "Room"("buildingId");
