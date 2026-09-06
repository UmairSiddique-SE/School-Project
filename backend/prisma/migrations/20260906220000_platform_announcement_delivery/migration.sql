ALTER TABLE "PlatformAnnouncement"
  ADD COLUMN "targetSchoolIds" JSONB,
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "deliveryCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "PlatformAnnouncement_scheduledAt_publishedAt_idx"
  ON "PlatformAnnouncement"("scheduledAt", "publishedAt");
