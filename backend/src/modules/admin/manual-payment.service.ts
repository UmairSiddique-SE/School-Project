import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ManualPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getOptions() {
    const [schools, plans] = await Promise.all([
      this.prisma.school.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      this.prisma.platformPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
        select: { planKey: true, name: true, price: true, currency: true },
      }),
    ]);
    return { schools, plans };
  }

  async create(dto: any, actor?: any) {
    const schoolId = String(dto?.schoolId || '').trim();
    const planKey = String(dto?.plan || '').trim();
    const method = String(dto?.method || '').trim();
    const paymentDate = new Date(dto?.paymentDate);
    const expiryDate = new Date(dto?.expiryDate);
    const amount = Number(dto?.amount);

    if (!schoolId || !planKey || !method) throw new BadRequestException('School, plan and payment method are required.');
    if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException('Amount must be a valid non-negative number.');
    if (Number.isNaN(paymentDate.getTime()) || Number.isNaN(expiryDate.getTime())) throw new BadRequestException('Payment date and expiry date must be valid dates.');
    if (expiryDate <= paymentDate) throw new BadRequestException('Expiry date must be after the payment date.');

    return this.prisma.$transaction(async (tx) => {
      const [school, plan, subscription] = await Promise.all([
        tx.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, isActive: true } }),
        tx.platformPlan.findUnique({ where: { planKey }, select: { planKey: true, name: true, price: true, currency: true, isActive: true } }),
        tx.subscription.findUnique({ where: { schoolId }, select: { id: true, startDate: true } }),
      ]);
      if (!school) throw new NotFoundException('School not found.');
      if (!plan || !plan.isActive) throw new BadRequestException('Selected plan is not available.');
      if (amount !== Number(plan.price)) throw new BadRequestException(`Amount must match the current ${plan.name} price (${plan.currency} ${plan.price}).`);
      if (!subscription) throw new NotFoundException('School subscription not found.');

      const payment = await tx.onboardingPayment.create({
        data: {
          schoolId,
          plan: plan.planKey,
          amount,
          method,
          reference: dto?.reference ? String(dto.reference).trim() : null,
          screenshotUrl: dto?.screenshotUrl ? String(dto.screenshotUrl).trim() : null,
          status: 'APPROVED',
          submittedAt: paymentDate,
          reviewedAt: new Date(),
        },
      });

      await tx.$executeRawUnsafe(
        'UPDATE "OnboardingPayment" SET "paymentDate" = $1, "expiryDate" = $2, "notes" = $3 WHERE "id" = $4',
        paymentDate,
        expiryDate,
        dto?.notes ? String(dto.notes).trim() : null,
        payment.id,
      );

      await tx.school.update({ where: { id: schoolId }, data: { isActive: true } });
      await tx.subscription.update({
        where: { schoolId },
        data: {
          plan: plan.planKey,
          status: 'ACTIVE',
          startDate: subscription.startDate,
          endDate: expiryDate,
          amount: plan.price,
          currency: plan.currency,
        },
      });

      if (actor?.id) {
        await tx.auditLog.create({
          data: {
            action: 'MANUAL_PAYMENT_ADDED',
            entity: 'OnboardingPayment',
            entityId: payment.id,
            after: `Manual ${plan.name} payment of ${plan.currency} ${amount} for ${school.name}; expiry ${expiryDate.toISOString().slice(0, 10)}`,
            schoolId,
            userId: actor.id,
          },
        });
      }

      return tx.onboardingPayment.findUnique({
        where: { id: payment.id },
        include: { school: { select: { name: true, slug: true } } },
      });
    });
  }
}
