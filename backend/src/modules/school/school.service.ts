import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcryptjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const FOREVER_DATE = new Date('9999-12-31T23:59:59.999Z');

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { search?: string; plan?: string; isActive?: string; page?: string; limit?: string }) {
    const page = query?.page ? parseInt(query.page, 10) : undefined;
    const limit = query?.limit ? parseInt(query.limit, 10) : undefined;
    const search = query?.search?.trim();
    const plan = query?.plan;
    const isActive = query?.isActive;
    const where: any = { deletedAt: null };
    if (search) where.OR = [{ name: { contains: search } }, { slug: { contains: search } }, { email: { contains: search } }];
    if (plan && plan !== 'ALL') where.subscription = { plan };
    if (isActive !== undefined && isActive !== 'ALL') where.isActive = isActive === 'true';

    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const [total, data] = await Promise.all([
        this.prisma.school.count({ where }),
        this.prisma.school.findMany({ where, include: { subscription: true, _count: { select: { users: true, students: true, teachers: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      ]);
      return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } } as any;
    }
    return this.prisma.school.findMany({ where, include: { subscription: true, _count: { select: { users: true, students: true, teachers: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        subscription: true,
        users: { where: { role: 'SCHOOL_ADMIN' }, select: { id: true, name: true, email: true, phone: true, isActive: true }, take: 1 },
        onboardingPayments: { orderBy: { createdAt: 'desc' }, take: 20 },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, action: true, after: true, createdAt: true } },
        _count: { select: { users: true, students: true, teachers: true, staff: true, classes: true } },
      },
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async create(data: any, actor?: any) {
    if (!data.name || !data.slug) throw new ConflictException('School name and slug are required');
    const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = await this.prisma.school.findFirst({ where: { OR: [{ slug: cleanSlug }, { name: data.name }] } });
    if (existing) throw new ConflictException('School with this name or slug already exists');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const school = await tx.school.create({ data: {
          name: data.name, slug: cleanSlug, domain: data.domain || null, email: data.email || null,
          phone: data.phone || null, address: data.address || null, city: data.city || null,
          state: data.state || null, country: data.country || 'Pakistan', isActive: true,
        } });
        const planKey = data.plan || 'FREE_TRIAL';
        const plan = await tx.platformPlan.findUnique({ where: { planKey: planKey } });
        if (!plan || !plan.isActive) throw new ConflictException('Selected plan is unavailable');
        const endDate = this.calculateEndDate(new Date(), plan.period);
        await tx.subscription.create({ data: {
          schoolId: school.id, plan: plan.planKey, status: 'ACTIVE', endDate,
          amount: plan.price, currency: plan.currency,
        } });
        if (data.adminEmail && data.adminPassword) {
          await tx.user.create({ data: {
            name: data.adminName || 'School Admin', email: data.adminEmail.trim().toLowerCase(),
            passwordHash: await bcrypt.hash(data.adminPassword, 12), role: 'SCHOOL_ADMIN',
            phone: data.adminPhone || null, schoolId: school.id, emailVerified: true,
          } });
        }
        await this.log(tx, actor, 'SCHOOL_CREATED', school.id, school.id, `Created ${school.name} with ${plan.name} subscription`);
        return school;
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('A school with this slug or email already exists');
      if (error?.status) throw error;
      console.error('Error creating school:', error);
      throw new ConflictException('Failed to create school');
    }
  }

  async update(id: string, data: any, actor?: any) {
    await this.findOne(id);
    if (data.slug) {
      const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      const existing = await this.prisma.school.findFirst({ where: { slug: cleanSlug, id: { not: id } } });
      if (existing) throw new ConflictException('Another school with this slug already exists');
      data.slug = cleanSlug;
    }
    try {
      const updated = await this.prisma.school.update({ where: { id }, data: {
        name: data.name ?? undefined, slug: data.slug ?? undefined, email: data.email ?? undefined,
        phone: data.phone ?? undefined, address: data.address ?? undefined, city: data.city ?? undefined,
        state: data.state ?? undefined, country: data.country ?? undefined, website: data.website ?? undefined,
      } });
      await this.log(this.prisma, actor, 'SCHOOL_UPDATED', id, id, `Updated school profile for ${updated.name}`);
      return updated;
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('A school with this slug or email already exists');
      if (error?.status) throw error;
      console.error('Error updating school:', error);
      throw new ConflictException('Failed to update school');
    }
  }

  async suspend(id: string, actor?: any) {
    const school = await this.findOne(id);
    const updated = await this.prisma.school.update({ where: { id }, data: { isActive: false } });
    await this.log(this.prisma, actor, 'SCHOOL_SUSPENDED', id, id, `Suspended ${school.name}`);
    return updated;
  }

  async activate(id: string, actor?: any) {
    const school = await this.findOne(id);
    const sub = school.subscription;
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status === 'EXPIRED' || sub.endDate < new Date()) throw new ConflictException('Cannot activate an expired subscription; renew or extend it first');
    const updated = await this.prisma.school.update({ where: { id }, data: { isActive: true } });
    await this.log(this.prisma, actor, 'SCHOOL_ACTIVATED', id, id, `Activated ${school.name}`);
    return updated;
  }

  async archive(id: string, actor?: any) {
    const school = await this.findOne(id);
    const updated = await this.prisma.school.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.log(this.prisma, actor, 'SCHOOL_ARCHIVED', id, id, `Archived ${school.name}`);
    return updated;
  }

  async extendExpiry(id: string, days: number, actor?: any) {
    await this.findOne(id);
    const sub = await this.prisma.subscription.findUnique({ where: { schoolId: id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (!Number.isInteger(days) || days < 1 || days > 3660) throw new ConflictException('Extension must be between 1 and 3660 days');
    if (sub.endDate >= FOREVER_DATE) return sub;
    const now = new Date();
    const base = sub.endDate > now ? sub.endDate : now;
    const newEnd = new Date(base.getTime() + days * DAY_MS);
    const updated = await this.prisma.subscription.update({ where: { schoolId: id }, data: { endDate: newEnd, status: 'ACTIVE' } });
    await this.log(this.prisma, actor, 'SUBSCRIPTION_EXTENDED', id, id, `Extended subscription by ${days} days`);
    return updated;
  }

  async changePlan(id: string, plan: string, _amount?: number, actor?: any) {
    const school = await this.findOne(id);
    const platformPlan = await this.prisma.platformPlan.findUnique({ where: { planKey: plan } });
    if (!platformPlan || !platformPlan.isActive) throw new ConflictException('Selected plan is unavailable');
    const now = new Date();
    const endDate = this.calculateEndDate(now, platformPlan.period);
    const updated = await this.prisma.subscription.update({ where: { schoolId: id }, data: {
      plan: platformPlan.planKey, amount: platformPlan.price, currency: platformPlan.currency,
      status: 'ACTIVE', startDate: now, endDate,
    } });
    if (!school.isActive) await this.prisma.school.update({ where: { id }, data: { isActive: true } });
    await this.log(this.prisma, actor, 'SUBSCRIPTION_PLAN_CHANGED', id, id, `Changed ${school.name} to ${platformPlan.name} at ${platformPlan.currency} ${platformPlan.price}`);
    return updated;
  }

  async expire(id: string, actor?: any) {
    const school = await this.findOne(id);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.school.update({ where: { id }, data: { isActive: false } });
      return tx.subscription.update({ where: { schoolId: id }, data: { status: 'EXPIRED', endDate: new Date() } });
    });
    await this.log(this.prisma, actor, 'SUBSCRIPTION_EXPIRED', id, id, `Expired ${school.name} subscription`);
    return updated;
  }

  async remove(id: string, actor?: any) { return this.archive(id, actor); }

  private calculateEndDate(start: Date, period: string): Date {
    const normalized = (period || '').trim().toLowerCase();
    if (normalized === 'forever') return new Date(FOREVER_DATE);
    const monthMatch = normalized.match(/(\d+)\s*month/);
    if (monthMatch) { const end = new Date(start); end.setMonth(end.getMonth() + Number(monthMatch[1])); return end; }
    const dayMatch = normalized.match(/(\d+)\s*day/);
    if (dayMatch) return new Date(start.getTime() + Number(dayMatch[1]) * DAY_MS);
    if (normalized.includes('year')) { const end = new Date(start); end.setFullYear(end.getFullYear() + Number(normalized.match(/\d+/)?.[0] || 1)); return end; }
    throw new ConflictException('Unsupported subscription period');
  }

  private async log(db: any, actor: any, action: string, entityId: string, schoolId: string, after: string) {
    if (!actor?.id) return;
    await db.auditLog.create({ data: { action, entity: 'School', entityId, schoolId, userId: actor.id, after } });
  }

  async getSuperAdminAnalytics() {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * DAY_MS);
    const [totalSchools, activeSchools, totalStudents, totalTeachers] = await Promise.all([
      this.prisma.school.count({ where: { deletedAt: null } }),
      this.prisma.school.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
    ]);
    const allSubs = await this.prisma.subscription.findMany({ select: { plan: true, status: true, endDate: true, amount: true } });
    const activeSubscriptions = allSubs.filter((s) => s.status === 'ACTIVE').length;
    const trialSchools = allSubs.filter((s) => s.plan === 'FREE_TRIAL' && s.status === 'ACTIVE').length;
    const expiringPlans = allSubs.filter((s) => s.endDate <= thirtyDaysLater && s.endDate >= now && s.status === 'ACTIVE').length;
    const totalRevenue = allSubs.reduce((sum, s) => sum + (s.amount || 0), 0);
    return { totalSchools, activeSchools, inactiveSchools: totalSchools - activeSchools, trialSchools, expiringPlans, totalStudents, totalTeachers, activeSubscriptions, totalRevenue, pendingPayments: 0 };
  }
}
