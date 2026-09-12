import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SchoolApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async review(id: string, action: 'APPROVED' | 'REJECTED', reviewNotes?: string, reviewedBy?: string, reviewerUserId?: string) {
    const request = await this.prisma.schoolRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('School request not found');
    if (request.status !== 'PENDING') throw new ConflictException('This request has already been reviewed');

    const existingSchool = request.subdomain
      ? await this.prisma.school.findUnique({ where: { slug: request.subdomain } })
      : await this.prisma.school.findFirst({ where: { email: request.email } });

    if (action === 'REJECTED') {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.schoolRequest.update({
          where: { id },
          data: { status: 'REJECTED', reviewNotes: reviewNotes || null, reviewedBy: reviewedBy || 'Super Admin', reviewedAt: new Date() },
        });
        if (existingSchool) {
          await tx.school.update({ where: { id: existingSchool.id }, data: { isActive: false } });
          await tx.user.updateMany({ where: { schoolId: existingSchool.id, role: 'SCHOOL_ADMIN' }, data: { isActive: false } });
        }
        if (reviewerUserId) {
          await tx.auditLog.create({
            data: { action: 'SCHOOL_REQUEST_REJECTED', entity: 'SchoolRequest', entityId: id, userId: reviewerUserId, schoolId: existingSchool?.id, after: `Rejected registration request for ${request.schoolName}` },
          });
        }
        return updated;
      });
    }

    if (!existingSchool) {
      throw new ConflictException('This request has no matching registered school account. Please ask the school to register again.');
    }

    const now = new Date();
const result = await this.prisma.$transaction(
  async (tx) => {
          const subscription = await tx.subscription.findUnique({ where: { schoolId: existingSchool.id } });
      const plan = await tx.platformPlan.findUnique({ where: { planKey: request.requestedPlan || subscription?.plan || 'FREE_TRIAL' } });
      const isFreeTrial = !plan || plan.planKey === 'FREE_TRIAL' || Number(plan.price) === 0;
      const approvedPayment = !isFreeTrial
        ? await tx.onboardingPayment.findFirst({ where: { schoolId: existingSchool.id, plan: plan?.planKey || request.requestedPlan, status: 'APPROVED' }, select: { id: true } })
        : null;
      const canActivate = isFreeTrial || !!approvedPayment;

      const updatedRequest = await tx.schoolRequest.update({
        where: { id },
        data: { status: 'APPROVED', reviewNotes: reviewNotes || null, reviewedBy: reviewedBy || 'Super Admin', reviewedAt: now },
      });

      await tx.school.update({ where: { id: existingSchool.id }, data: { isActive: canActivate } });
      await tx.user.updateMany({ where: { schoolId: existingSchool.id, role: 'SCHOOL_ADMIN' }, data: { isActive: canActivate } });

      if (subscription && isFreeTrial && plan) {
        await tx.subscription.update({
          where: { schoolId: existingSchool.id },
          data: { plan: plan.planKey, status: 'ACTIVE', startDate: now, endDate: this.calculateEndDate(now, plan.period), amount: plan.price, currency: plan.currency },
        });
      }

      const finalReviewerId = reviewerUserId || (await tx.user.findFirst({ where: { role: 'SUPER_ADMIN' }, select: { id: true } }))?.id;
      if (finalReviewerId) {
        await tx.auditLog.create({
          data: { action: 'SCHOOL_REQUEST_APPROVED', entity: 'SchoolRequest', entityId: id, schoolId: existingSchool.id, userId: finalReviewerId, after: canActivate ? `Approved and activated registration request for ${request.schoolName}.` : `Approved registration request for ${request.schoolName}; payment is still pending, so login remains locked.` },
        });
      }

       return {
        updatedRequest,
        subscription: await tx.subscription.findUnique({
          where: { schoolId: existingSchool.id },
        }),
        canActivate,
      };
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );

    return {
      ...result.updatedRequest,
      school: { id: existingSchool.id, name: existingSchool.name, slug: existingSchool.slug },
      loginPath: `/${existingSchool.slug}/login`,
      activationStatus: result.canActivate ? 'ACTIVE' : 'PAYMENT_PENDING',
    };
  }

  private calculateEndDate(start: Date, period: string): Date {
    const normalized = (period || '').trim().toLowerCase();
    if (normalized === 'forever') return new Date('9999-12-31T23:59:59.999Z');
    if (normalized === 'trial' || normalized === 'free trial' || normalized === 'free_trial') return new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
    const monthMatch = normalized.match(/(\d+)\s*month/);
    if (monthMatch) { const end = new Date(start); end.setMonth(end.getMonth() + Number(monthMatch[1])); return end; }
    const dayMatch = normalized.match(/(\d+)\s*day/);
    if (dayMatch) return new Date(start.getTime() + Number(dayMatch[1]) * 24 * 60 * 60 * 1000);
    if (normalized.includes('year')) { const end = new Date(start); end.setFullYear(end.getFullYear() + Number(normalized.match(/\d+/)?.[0] || 1)); return end; }
    if (normalized === 'per month' || normalized === 'monthly' || normalized === 'month') { const end = new Date(start); end.setMonth(end.getMonth() + 1); return end; }
    throw new ConflictException('Unsupported subscription period');
  }
}
