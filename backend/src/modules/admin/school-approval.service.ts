import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
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
    selectedPlan?: string,
    reviewedBy?: string,
    reviewerUserId?: string,
  ) {
    const request = await this.prisma.schoolRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('School request not found');
    if (request.status !== 'PENDING') throw new ConflictException('This request has already been reviewed');

    if (action === 'REJECTED') {
      if (!reviewNotes?.trim()) throw new BadRequestException('A rejection reason is required');
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.schoolRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
            reviewNotes: reviewNotes || null,
            reviewedBy: reviewedBy || 'Super Admin',
            reviewedAt: new Date(),
          },
        });

        if (reviewerUserId) {
          await tx.auditLog.create({
            data: {
              action: 'SCHOOL_REQUEST_REJECTED',
              entity: 'SchoolRequest',
              entityId: id,
              userId: reviewerUserId,
              after: `Rejected registration request for ${request.schoolName}`,
            },
          });
        }

        return updated;
      });
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: request.email } });
    if (existingUser) throw new ConflictException('The contact email is already registered to an existing user');

    let baseSlug = request.schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'school';

    let slug = baseSlug;
    let index = 1;
    while (await this.prisma.school.findUnique({ where: { slug } })) slug = `${baseSlug}-${index++}`;

    // Generate a cryptographically secure temporary password; never use Math.random() for credentials.
    const tempPassword = randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const planKey = selectedPlan?.trim() || request.requestedPlan || 'FREE_TRIAL';
    const plan = await this.prisma.platformPlan.findUnique({ where: { planKey } });
    if (!plan || !plan.isActive) throw new ConflictException('The requested subscription plan is unavailable');

    const isFreeTrial = planKey === 'FREE_TRIAL' || Number(plan.price) === 0;
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const subscriptionEnd = isFreeTrial ? trialEnd : now;

    const result = await this.prisma.$transaction(async (tx) => {
      // The school account is created immediately so the owner can log in and pay.
      // Paid plans remain PAYMENT_PENDING until the separate payment review approves them.
      const school = await tx.school.create({
        data: {
          name: request.schoolName,
          slug,
          email: request.email,
          phone: request.phone,
          city: request.city,
          address: request.address,
          country: 'Pakistan',
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          name: request.ownerName,
          email: request.email,
          passwordHash,
          role: 'SCHOOL_ADMIN',
          schoolId: school.id,
          isActive: true,
          mustChangePassword: true,
          emailVerified: true,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          schoolId: school.id,
          plan: plan.planKey,
          status: isFreeTrial ? 'ACTIVE' : 'PENDING',
          endDate: subscriptionEnd,
          amount: plan.price,
          currency: plan.currency,
        },
      });

      const updatedRequest = await tx.schoolRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewNotes: reviewNotes || null,
          reviewedBy: reviewedBy || 'Super Admin',
          reviewedAt: now,
        },
      });

      let finalReviewerId = reviewerUserId;
      if (!finalReviewerId) {
        finalReviewerId = (await tx.user.findFirst({ where: { role: 'SUPER_ADMIN' } }))?.id;
      }

      if (finalReviewerId) {
        await tx.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'School',
            entityId: school.id,
            after: `Approved registration request for ${request.schoolName} on ${plan.name}. Created school ID: ${school.id}. ${isFreeTrial ? 'Free trial active.' : 'Paid plan awaiting payment approval.'}`,
            userId: finalReviewerId,
          },
        });
      }

      return { school, user, subscription, updatedRequest };
    });

    this.mailService
      .sendSchoolOnboarding(result.user.email, {
        schoolName: result.school.name,
        schoolSlug: result.school.slug,
        adminName: result.user.name,
        temporaryPassword: tempPassword,
        plan: result.subscription.plan,
      })
      .catch((err) => console.error('Failed to send onboarding email:', err));

    return result.updatedRequest;
  }
}
