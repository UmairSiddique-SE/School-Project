import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const FOREVER_DATE = new Date('9999-12-31T23:59:59.999Z');
const EXPIRY_SYNC_MS = 5 * 60 * 1000;

@Injectable()
export class PaymentLifecycleService implements OnModuleInit, OnModuleDestroy {
  private expiryTimer?: ReturnType<typeof setInterval>;
  private expirySyncRunning = false;
  private readonly logger = new Logger(PaymentLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.runExpirySync();
    this.expiryTimer = setInterval(() => void this.runExpirySync(), EXPIRY_SYNC_MS);
  }

  onModuleDestroy() {
    if (this.expiryTimer) clearInterval(this.expiryTimer);
  }

  private async runExpirySync() {
    if (this.expirySyncRunning) return;
    this.expirySyncRunning = true;
    try {
      await this.syncExpiredSubscriptions();
    } catch (error) {
      this.logger.error(`Subscription expiry sync skipped: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.expirySyncRunning = false;
    }
  }

  async syncExpiredSubscriptions() {
    const now = new Date();
    const expired = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE', endDate: { lte: now } },
      select: { schoolId: true },
    });
    if (!expired.length) return { count: 0 };
    const schoolIds = expired.map((s) => s.schoolId);
    await this.prisma.$transaction([
      this.prisma.subscription.updateMany({
        where: { schoolId: { in: schoolIds }, status: 'ACTIVE', endDate: { lte: now } },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.school.updateMany({
        where: { id: { in: schoolIds }, deletedAt: null },
        data: { isActive: false },
      }),
    ]);
    return { count: schoolIds.length };
  }

  async approvePayment(id: string, actor?: any) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.onboardingPayment.findUnique({
        where: { id },
        include: { school: { select: { id: true, name: true } } },
      });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status !== 'PENDING') throw new BadRequestException('Only pending payments can be approved');

      const plan = await tx.platformPlan.findUnique({ where: { planKey: payment.plan } });
      if (!plan || !plan.isActive) throw new BadRequestException('The selected subscription plan is unavailable');
      if (Number(payment.amount) !== Number(plan.price)) {
        throw new BadRequestException(`Payment amount does not match the current ${plan.name} plan price`);
      }

      const now = new Date();
      const updatedPayment = await tx.onboardingPayment.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedAt: now },
      });
      if (updatedPayment.count !== 1) throw new BadRequestException('Payment was already reviewed');

      if (actor?.id) {
        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_APPROVED',
            entity: 'OnboardingPayment',
            entityId: id,
            after: `Approved ${plan.name} payment of ${plan.currency} ${plan.price} for ${payment.school.name}. School remains pending until request approval.`,
            schoolId: payment.schoolId,
            userId: actor.id,
          },
        });
      }

      return tx.onboardingPayment.findUnique({
        where: { id },
        include: { school: { select: { name: true, slug: true, isActive: true } } },
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
      if (payment.status !== 'PENDING') throw new BadRequestException('Only pending payments can be rejected');
      const now = new Date();
      const rejected = await tx.onboardingPayment.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'REJECTED', reviewedAt: now },
      });
      if (rejected.count !== 1) throw new BadRequestException('Payment was already reviewed');
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
        include: { school: { select: { name: true, slug: true, isActive: true } } },
      });
    });
  }

  private calculateEndDate(start: Date, period: string): Date {
    const normalized = (period || '').trim().toLowerCase();
    if (normalized === 'forever') return new Date(FOREVER_DATE);
    if (normalized === 'per month' || normalized === 'monthly' || normalized === 'month') {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return end;
    }
    const monthMatch = normalized.match(/(\d+)\s*month/);
    if (monthMatch) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + Number(monthMatch[1]));
      return end;
    }
    const dayMatch = normalized.match(/(\d+)\s*day/);
    if (dayMatch) return new Date(start.getTime() + Number(dayMatch[1]) * DAY_MS);
    if (normalized.includes('year')) {
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + Number(normalized.match(/\d+/)?.[0] || 1));
      return end;
    }
    if (normalized === 'free trial' || normalized === 'trial') return new Date(start.getTime() + 3 * DAY_MS);
    throw new BadRequestException('Unsupported subscription period');
  }
}
