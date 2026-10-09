CREATE TABLE "GatePass" (
    "id" TEXT NOT NULL,
    "passNo" TEXT NOT NULL,
    "reasonType" TEXT NOT NULL DEFAULT 'EARLY_LEAVE',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "issuedById" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "exitMarkedById" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "GatePass_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GatePass_passNo_key" ON "GatePass"("passNo");
CREATE INDEX "GatePass_schoolId_createdAt_idx" ON "GatePass"("schoolId", "createdAt");
CREATE INDEX "GatePass_studentId_createdAt_idx" ON "GatePass"("studentId", "createdAt");
CREATE INDEX "GatePass_schoolId_status_idx" ON "GatePass"("schoolId", "status");

ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
