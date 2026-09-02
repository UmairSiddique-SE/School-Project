-- CreateTable
CREATE TABLE "OnboardingPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OnboardingPayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OnboardingPayment_schoolId_idx" ON "OnboardingPayment"("schoolId");
CREATE INDEX "OnboardingPayment_status_idx" ON "OnboardingPayment"("status");
