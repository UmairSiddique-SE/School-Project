import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: {
    search?: string;
    plan?: string;
    isActive?: string;
    page?: string;
    limit?: string;
  }) {
    const page = query?.page ? parseInt(query.page, 10) : undefined;
    const limit = query?.limit ? parseInt(query.limit, 10) : undefined;
    const search = query?.search?.trim();
    const plan = query?.plan;
    const isActive = query?.isActive;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (plan && plan !== 'ALL') {
      where.subscription = { plan };
    }

    if (isActive !== undefined && isActive !== 'ALL') {
      where.isActive = isActive === 'true';
    }

    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const [total, data] = await Promise.all([
        this.prisma.school.count({ where }),
        this.prisma.school.findMany({
          where,
          include: {
            subscription: true,
            _count: {
              select: {
                users: true,
                students: true,
                teachers: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      } as any;
    }

    return this.prisma.school.findMany({
      where,
      include: {
        subscription: true,
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        subscription: true,
        _count: {
          select: { users: true, students: true, teachers: true },
        },
      },
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async create(data: any) {
    if (!data.name || !data.slug) {
      throw new ConflictException('School name and slug are required');
    }

    const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const existing = await this.prisma.school.findFirst({
      where: {
        OR: [
          { slug: cleanSlug },
          { name: data.name },
        ],
      },
    });
    if (existing) {
      throw new ConflictException('School with this name or slug already exists');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const school = await tx.school.create({
          data: {
            name: data.name,
            slug: cleanSlug,
            domain: data.domain || null,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            country: data.country || 'Pakistan',
            isActive: true,
          },
        });

        const plan = data.plan || 'FREE_TRIAL';
        const daysMap: Record<string, number> = {
          FREE_TRIAL: 14,
          BASIC: 365,
          STANDARD: 365,
          PREMIUM: 365,
        };
        const days = daysMap[plan] ?? 365;

        await tx.subscription.create({
          data: {
            schoolId: school.id,
            plan,
            status: 'ACTIVE',
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
            amount: data.amount || 0,
          },
        });

        return school;
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('A school with this slug or email already exists');
      }
      if (error?.status) throw error;
      console.error('Error creating school:', error);
      throw new ConflictException('Failed to create school');
    }
  }

  async update(id: string, data: any) {
    await this.findOne(id);

    if (data.slug) {
      const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      const existing = await this.prisma.school.findFirst({
        where: { slug: cleanSlug, id: { not: id } },
      });
      if (existing) throw new ConflictException('Another school with this slug already exists');
      data.slug = cleanSlug;
    }

    try {
      return await this.prisma.school.update({
        where: { id },
        data: {
          name: data.name ?? undefined,
          slug: data.slug ?? undefined,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
          address: data.address ?? undefined,
          city: data.city ?? undefined,
          state: data.state ?? undefined,
          country: data.country ?? undefined,
          website: data.website ?? undefined,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('A school with this slug or email already exists');
      }
      if (error?.status) throw error;
      console.error('Error updating school:', error);
      throw new ConflictException('Failed to update school');
    }
  }

  async suspend(id: string) {
    await this.findOne(id);
    return this.prisma.school.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.school.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.school.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async extendExpiry(id: string, days: number) {
    await this.findOne(id);
    const sub = await this.prisma.subscription.findUnique({ where: { schoolId: id } });
    if (!sub) throw new NotFoundException('Subscription not found');

    const base = sub.endDate > new Date() ? sub.endDate : new Date();
    const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.subscription.update({
      where: { schoolId: id },
      data: { endDate: newEnd, status: 'ACTIVE' },
    });
  }

  async changePlan(id: string, plan: string, amount?: number) {
    await this.findOne(id);
    const updateData: any = { plan };
    if (amount !== undefined) updateData.amount = amount;
    return this.prisma.subscription.update({
      where: { schoolId: id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.archive(id);
  }

  async getSuperAdminAnalytics() {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
    ] = await Promise.all([
      this.prisma.school.count({ where: { deletedAt: null } }),
      this.prisma.school.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
    ]);

    const allSubs = await this.prisma.subscription.findMany({
      select: { plan: true, status: true, endDate: true, amount: true },
    });

    const activeSubscriptions = allSubs.filter(s => s.status === 'ACTIVE').length;
    const trialSchools = allSubs.filter(s => s.plan === 'FREE_TRIAL' && s.status === 'ACTIVE').length;
    const expiringPlans = allSubs.filter(
      s => s.endDate <= thirtyDaysLater && s.endDate >= now && s.status === 'ACTIVE'
    ).length;
    const totalRevenue = allSubs.reduce((sum, s) => sum + (s.amount || 0), 0);
    const inactiveSchools = totalSchools - activeSchools;

    return {
      totalSchools,
      activeSchools,
      inactiveSchools,
      trialSchools,
      expiringPlans,
      totalStudents,
      totalTeachers,
      activeSubscriptions,
      totalRevenue,
      pendingPayments: 0, // Will be implemented with payment model
    };
  }
}
