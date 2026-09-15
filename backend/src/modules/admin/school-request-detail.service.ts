import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SchoolRequestDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const request = await this.prisma.schoolRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('School request not found');

    const school = request.subdomain
      ? await this.prisma.school.findUnique({
          where: { slug: request.subdomain },
          include: { subscription: true },
        })
      : await this.prisma.school.findFirst({
          where: { email: request.email },
          include: { subscription: true },
        });

    const [admins, payments, plan] = await Promise.all([
      school
        ? this.prisma.user.findMany({
            where: { schoolId: school.id, role: 'SCHOOL_ADMIN' },
            select: { id: true, name: true, email: true, phone: true, isActive: true, emailVerified: true, lastLoginAt: true, createdAt: true },
          })
        : Promise.resolve([]),
      school
        ? this.prisma.onboardingPayment.findMany({
            where: { schoolId: school.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, plan: true, amount: true, method: true, reference: true, screenshotUrl: true, status: true, submittedAt: true, reviewedAt: true, createdAt: true },
          })
        : Promise.resolve([]),
      this.prisma.platformPlan.findUnique({ where: { planKey: request.requestedPlan || 'FREE_TRIAL' } }),
    ]);

    const latestPayment = payments[0] || null;
    const expectedAmount = plan ? Number(plan.price) : 0;
    const paymentAmount = latestPayment ? Number(latestPayment.amount) : 0;
    const isFree = expectedAmount === 0 || (request.requestedPlan || '').toUpperCase() === 'FREE_TRIAL';

    return {
      request,
      school: school
        ? {
            id: school.id,
            name: school.name,
            slug: school.slug,
            domain: school.domain,
            type: school.type,
            email: school.email,
            phone: school.phone,
            address: school.address,
            city: school.city,
            state: school.state,
            country: school.country,
            postalCode: school.postalCode,
            logoUrl: school.logoUrl,
            website: school.website,
            isActive: school.isActive,
            createdAt: school.createdAt,
            subscription: school.subscription,
          }
        : null,
      admins,
      payments,
      plan: plan
        ? { planKey: plan.planKey, name: plan.name, price: plan.price, currency: plan.currency, period: plan.period, maxStudents: plan.maxStudents, maxTeachers: plan.maxTeachers, storageMb: plan.storageMb, supportTier: plan.supportTier, features: JSON.parse(plan.features || '[]') }
        : null,
      review: {
        isFree,
        expectedAmount,
        paymentAmount,
        amountMatches: isFree ? true : paymentAmount === expectedAmount,
        paymentSubmitted: Boolean(latestPayment),
        paymentPending: latestPayment?.status === 'PENDING',
        paymentApproved: latestPayment?.status === 'APPROVED',
        hasScreenshot: Boolean(latestPayment?.screenshotUrl),
        paymentMethod: latestPayment?.method || null,
        reference: latestPayment?.reference || null,
      },
    };
  }
}
