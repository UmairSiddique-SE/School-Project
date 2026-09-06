ALTER TABLE "OnboardingPayment" ADD COLUMN "paymentDate" TIMESTAMP(3);
ALTER TABLE "OnboardingPayment" ADD COLUMN "expiryDate" TIMESTAMP(3);
ALTER TABLE "OnboardingPayment" ADD COLUMN "notes" TEXT;

CREATE INDEX "OnboardingPayment_paymentDate_idx" ON "OnboardingPayment"("paymentDate");
CREATE INDEX "OnboardingPayment_expiryDate_idx" ON "OnboardingPayment"("expiryDate");
