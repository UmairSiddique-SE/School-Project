import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OnboardingStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(user: { id?: string; schoolId?: string; role?: string }) {
    if (user.role !== 'SCHOOL_ADMIN' || !user.schoolId) {
      throw new UnauthorizedException('School onboarding is only available to school administrators.');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: user.schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        subscription: {
          select: { plan: true, status: true, startDate: true, endDate: true, amount: true, currency: true },
        },
      },
    });

    if (!school) throw new UnauthorizedException('School account not found.');

    const request = await this.prisma.schoolRequest.findFirst({
      where: { email: (await this.prisma.user.findUnique({ where: { id: user.id }, select: { email: true } }))?.email ?? '', schoolRequest: undefined as never },
    }).catch(() => null);

    const latestPayment = await this.prisma.onboardingPayment.findFirst({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, plan: true, amount: true, method: true, reference: true, screenshotUrl: true, status: true, submittedAt: true, reviewedAt: true },
    });

    const schoolRequest = await this.prisma.schoolRequest.findFirst({
      where: { subdomain: school.slug },
      orderBy: { createdAt: 'desc' },
      select: { id: true, requestedPlan: true, status: true, createdAt: true, reviewedAt: true, reviewNotes: true },
    });

    const plan = await this.prisma.platformPlan.findUnique({
      where: { planKey: school.subscription?.plan || schoolRequest?.requestedPlan || 'FREE_TRIAL' },
      select: { planKey: true, name: true, price: true, currency: true, period: true, isActive: true },
    });

    const isActive = school.isActive && school.subscription?.status === 'ACTIVE' && !!school.subscription.endDate && school.subscription.endDate > new Date();
    const isFreeTrial = plan?.planKey === 'FREE_TRIAL' || Number(plan?.price || 0) === 0;
    const onboardingStatus = isActive
      ? 'ACTIVE'
      : isFreeTrial || latestPayment?.status === 'APPROVED'
        ? 'APPROVAL_PENDING'
        : 'PAYMENT_REQUIRED';

    return {
      onboardingStatus,
      school,
      request: schoolRequest,
      payment: latestPayment,
      plan,
    };
  }
}
