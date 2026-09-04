import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const FOREVER_DATE = new Date('9999-12-31T23:59:59.999Z');

@Injectable()
export class PaymentLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async approvePayment(id: string, actor?: any) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.onboardingPayment.findUnique({
        where: { id },
        include: { school: { select: { id: true, name: true } } },
      });

      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status !== 'PENDING') {
        throw new BadRequestException('Only pending payments can be approved');
      }

      const plan = await tx.platformPlan.findUnique({
        where: { planKey: payment.plan },
      });
      if (!plan || !plan.isActive) {
        throw new BadRequestException('The selected subscription plan is unavailable');
      }

      if (payment.amount !== plan.price) {
        throw new BadRequestException(
          `Payment amount does not match the current ${plan.name} plan price`,
        );
      }

      const subscription = await tx.subscription.findUnique({
        where: { schoolId: payment.schoolId },
      });
      if (!subscription) throw new NotFoundException('School subscription not found');

      const now = new Date();
      const endDate = this.calculateEndDate(now, plan.period);

      const updatedPayment = await tx.onboardingPayment.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          reviewedAt: now,
        },
      });
      if (updatedPayment.count !== 1) {
        throw new BadRequestException('Payment was already reviewed');
      }

      await tx.school.update({
        where: { id: payment.schoolId },
        data: { isActive: true },
      });

      await tx.subscription.update({
        where: { schoolId: payment.schoolId },
        data: {
          plan: plan.planKey,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          amount: plan.price,
          currency: plan.currency,
        },
      });

      if (actor?.id) {
        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_APPROVED',
            entity: 'OnboardingPayment',
            entityId: id,
            after: `Approved ${plan.name} payment of ${plan.currency} ${plan.price} for ${payment.school.name}`,
            schoolId: payment.schoolId,
            userId: actor.id,
          },
        });
      }

      const users = await tx.user.findMany({
        where: { schoolId: payment.schoolId, isActive: true },
        select: { id: true },
      });
      if (users.length) {
        await tx.notification.createMany({
          data: users.map((user) => ({
            type: 'PAYMENT',
            title: 'Payment approved',
            message: `Your ${plan.name} subscription payment has been approved and is active until ${endDate.toISOString().slice(0, 10)}.`,
            schoolId: payment.schoolId,
            userId: user.id,
          })),
        });
      }

      return tx.onboardingPayment.findUnique({
        where: { id },
        include: { school: { select: { name: true, slug: true } } },
      });
    });
  }

  async rejectPayment(id: string, actor?: any) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.onboardingPayment.findUnique({
        where: { id },
        include: { school: { select: { id: true, name: true } } },
      });

      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status !== 'PENDING') {
        throw new BadRequestException('Only pending payments can be rejected');
      }

      const now = new Date();
      const rejected = await tx.onboardingPayment.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          reviewedAt: now,
        },
      });
      if (rejected.count !== 1) {
        throw new BadRequestException('Payment was already reviewed');
      }

      if (actor?.id) {
        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_REJECTED',
            entity: 'OnboardingPayment',
            entityId: id,
            after: `Rejected ${payment.amount} ${payment.school.name} payment for ${payment.plan}`,
            schoolId: payment.schoolId,
            userId: actor.id,
          },
        });
      }

      const users = await tx.user.findMany({
        where: { schoolId: payment.schoolId, isActive: true },
        select: { id: true },
      });
      if (users.length) {
        await tx.notification.createMany({
          data: users.map((user) => ({
            type: 'PAYMENT',
            title: 'Payment rejected',
            message: `Your ${payment.plan} subscription payment was rejected. Please review the payment details and submit a new payment.`,
            schoolId: payment.schoolId,
            userId: user.id,
          })),
        });
      }

      return tx.onboardingPayment.findUnique({
        where: { id },
        include: { school: { select: { name: true, slug: true } } },
      });
    });
  }

  private calculateEndDate(start: Date, period: string): Date {
    const normalized = period.trim().toLowerCase();
    if (normalized === 'forever') return FOREVER_DATE;

    const monthMatch = normalized.match(/(\d+)\s*month/);
    if (monthMatch) {
      const months = Number(monthMatch[1]);
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      return end;
    }

    const dayMatch = normalized.match(/(\d+)\s*day/);
    if (dayMatch) return new Date(start.getTime() + Number(dayMatch[1]) * DAY_MS);

    if (normalized.includes('year')) {
      const years = Number(normalized.match(/\d+/)?.[0] || 1);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + years);
      return end;
    }

    throw new BadRequestException('Unsupported subscription period');
  }
}
