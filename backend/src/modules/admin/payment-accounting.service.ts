import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class PaymentAccountingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const dayStart = startOfDay(now);
    const next7 = addDays(now, 7);
    const next30 = addDays(now, 30);

    const [approved, pendingAgg, rejectedAgg, upcomingSubs, overdueSubs, pendingSchools] = await Promise.all([
      this.prisma.onboardingPayment.findMany({
        where: { status: 'APPROVED' },
        select: { id: true, schoolId: true, amount: true, createdAt: true, reviewedAt: true, plan: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.onboardingPayment.aggregate({ _sum: { amount: true }, _count: { _all: true }, where: { status: 'PENDING' } }),
      this.prisma.onboardingPayment.aggregate({ _sum: { amount: true }, _count: { _all: true }, where: { status: 'REJECTED' } }),
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE', endDate: { gt: now, lte: next30 }, amount: { gt: 0 }, school: { deletedAt: null } },
        select: { schoolId: true, plan: true, amount: true, endDate: true },
        orderBy: { endDate: 'asc' },
      }),
      this.prisma.subscription.findMany({
        where: { endDate: { lt: now }, amount: { gt: 0 }, school: { deletedAt: null } },
        select: { schoolId: true, plan: true, amount: true, endDate: true },
      }),
      this.prisma.onboardingPayment.findMany({ where: { status: 'PENDING' }, select: { schoolId: true } }),
    ]);

    const pendingSchoolIds = new Set(pendingSchools.map((p) => p.schoolId));
    const firstPaymentIds = new Set<string>();
    const seenSchools = new Set<string>();
    for (const payment of approved) {
      if (!seenSchools.has(payment.schoolId)) {
        firstPaymentIds.add(payment.id);
        seenSchools.add(payment.schoolId);
      }
    }

    const monthApproved = approved.filter((p) => (p.reviewedAt || p.createdAt) >= monthStart);
    const todayApproved = approved.filter((p) => (p.reviewedAt || p.createdAt) >= dayStart);
    const monthFirstTimeRevenue = monthApproved.filter((p) => firstPaymentIds.has(p.id)).reduce((s, p) => s + Number(p.amount || 0), 0);
    const monthRecurringRevenue = monthApproved.filter((p) => !firstPaymentIds.has(p.id)).reduce((s, p) => s + Number(p.amount || 0), 0);
    const firstTimePaymentCount = approved.filter((p) => firstPaymentIds.has(p.id)).length;
    const recurringPaymentCount = Math.max(0, approved.length - firstTimePaymentCount);

    const upcoming = upcomingSubs.filter((s) => !pendingSchoolIds.has(s.schoolId));
    const upcoming7 = upcoming.filter((s) => s.endDate <= next7);
    const expectedNext7Revenue = upcoming7.reduce((s, x) => s + Number(x.amount || 0), 0);
    const expectedNext30Revenue = upcoming.reduce((s, x) => s + Number(x.amount || 0), 0);
    const overdueRevenue = overdueSubs.reduce((s, x) => s + Number(x.amount || 0), 0);

    const timelineMap = new Map<string, { month: string; firstTime: number; recurring: number; total: number }>();
    for (const payment of approved) {
      const date = payment.reviewedAt || payment.createdAt;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const item = timelineMap.get(key) || { month: key, firstTime: 0, recurring: 0, total: 0 };
      const amount = Number(payment.amount || 0);
      item.total += amount;
      if (firstPaymentIds.has(payment.id)) item.firstTime += amount;
      else item.recurring += amount;
      timelineMap.set(key, item);
    }

    return {
      monthRevenue: monthApproved.reduce((s, p) => s + Number(p.amount || 0), 0),
      todayRevenue: todayApproved.reduce((s, p) => s + Number(p.amount || 0), 0),
      allTimeRevenue: approved.reduce((s, p) => s + Number(p.amount || 0), 0),
      monthFirstTimeRevenue,
      monthRecurringRevenue,
      firstTimePaymentCount,
      recurringPaymentCount,
      pendingRevenue: Number(pendingAgg._sum.amount || 0),
      pendingCount: pendingAgg._count._all,
      rejectedRevenue: Number(rejectedAgg._sum.amount || 0),
      rejectedCount: rejectedAgg._count._all,
      expectedNext7Revenue,
      expectedNext30Revenue,
      expectedNext7Count: upcoming7.length,
      expectedNext30Count: upcoming.length,
      overdueRevenue,
      overdueCount: overdueSubs.length,
      timeline: Array.from(timelineMap.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12),
    };
  }

  async getPayments(params: { page?: number; limit?: number; status?: string; search?: string; date?: string }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(10, Number(params.limit || 25)));
    const status = params.status && params.status !== 'ALL' ? params.status : undefined;
    const search = params.search?.trim();
    const date = params.date?.trim();

    const where: any = {};
    if (status) where.status = status;
    if (date) {
      const from = new Date(`${date}T00:00:00`);
      const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
      where.createdAt = { gte: from, lt: to };
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { plan: { contains: search, mode: 'insensitive' } },
        { method: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { school: { name: { contains: search, mode: 'insensitive' } } },
        { school: { slug: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.onboardingPayment.count({ where }),
      this.prisma.onboardingPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { school: { select: { name: true, slug: true } } },
      }),
    ]);

    const schoolIds = [...new Set(rows.map((p) => p.schoolId))];
    const history = schoolIds.length
      ? await this.prisma.onboardingPayment.findMany({
          where: { schoolId: { in: schoolIds }, status: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, schoolId: true, plan: true },
        })
      : [];
    const firstPaymentIdBySchool = new Map<string, string>();
    for (const payment of history) {
      if (!firstPaymentIdBySchool.has(payment.schoolId)) firstPaymentIdBySchool.set(payment.schoolId, payment.id);
    }

    const data = rows.map((payment) => {
      const firstPaymentId = firstPaymentIdBySchool.get(payment.schoolId);
      const paymentType = payment.status === 'APPROVED'
        ? (firstPaymentId === payment.id ? 'FIRST_PAYMENT' : 'RECURRING')
        : firstPaymentId ? 'RENEWAL_PENDING' : 'FIRST_PAYMENT_PENDING';
      return { ...payment, paymentType };
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      accounting: await this.getSummary(),
    };
  }
}
