import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SchoolApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async review(
    id: string,
    action: 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
    reviewedBy?: string,
    reviewerUserId?: string,
  ) {
    const request = await this.prisma.schoolRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('School request not found');
    if (request.status !== 'PENDING') throw new ConflictException('This request has already been reviewed');

    // Registration now creates the real School/User/Subscription first. The
    // request is only the Super Admin review record; approval must never create
    // a second school or a second admin account.
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

    if (existingSchool) {
      const now = new Date();
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedRequest = await tx.schoolRequest.update({
          where: { id },
          data: { status: 'APPROVED', reviewNotes: reviewNotes || null, reviewedBy: reviewedBy || 'Super Admin', reviewedAt: now },
        });

        await tx.school.update({ where: { id: existingSchool.id }, data: { isActive: true } });
        await tx.user.updateMany({ where: { schoolId: existingSchool.id, role: 'SCHOOL_ADMIN' }, data: { isActive: true } });

        const subscription = await tx.subscription.findUnique({ where: { schoolId: existingSchool.id } });
        const plan = await tx.platformPlan.findUnique({ where: { planKey: request.requestedPlan || subscription?.plan || 'FREE_TRIAL' } });
        if (subscription && plan) {
          const isFreeTrial = Number(plan.price) === 0 || plan.planKey === 'FREE_TRIAL';
          if (isFreeTrial) {
            await tx.subscription.update({ where: { schoolId: existingSchool.id }, data: { plan: plan.planKey, status: 'ACTIVE', startDate: now, endDate: this.calculateEndDate(now, plan.period), amount: plan.price, currency: plan.currency } });
          }
        }

        const finalReviewerId = reviewerUserId || (await tx.user.findFirst({ where: { role: 'SUPER_ADMIN' }, select: { id: true } }))?.id;
        if (finalReviewerId) {
          await tx.auditLog.create({
            data: { action: 'SCHOOL_REQUEST_APPROVED', entity: 'SchoolRequest', entityId: id, schoolId: existingSchool.id, userId: finalReviewerId, after: `Approved registration request for ${request.schoolName}. Existing school account retained.` },
          });
        }

        return { updatedRequest, subscription: await tx.subscription.findUnique({ where: { schoolId: existingSchool.id } }) };
      });

      return {
        ...result.updatedRequest,
        school: { id: existingSchool.id, name: existingSchool.name, slug: existingSchool.slug },
        loginPath: `/${existingSchool.slug}/login`,
        activationStatus: result.subscription?.status === 'ACTIVE' ? 'ACTIVE' : 'PAYMENT_PENDING',
      };
    }

    // Backward compatibility for old manually-created SchoolRequest rows that
    // predate the current registration flow and have no matching school yet.
    throw new ConflictException('This request has no matching registered school account. Please ask the school to register again.');
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
