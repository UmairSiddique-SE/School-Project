import { Prisma } from '@prisma/client';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  OnboardingPaymentDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from './strategies/jwt.strategy';
import { parseDurationMs } from '../../config/env.config';

const DAY_MS = 24 * 60 * 60 * 1000;
const FOREVER_DATE = new Date('9999-12-31T23:59:59.999Z');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto) {
    const rawIdentifier = dto.email ? String(dto.email).trim() : '';
    const identifier = rawIdentifier.toLowerCase();
    const cleanId = identifier.replace(/[^a-z0-9]/g, '');

    const userInclude = {
      school: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          subscription: {
            select: { plan: true, status: true, endDate: true },
          },
        },
      },
    };

    let targetSchoolId: string | undefined = undefined;
    if (dto.schoolSlug) {
      const sch = await this.prisma.school.findUnique({
        where: { slug: dto.schoolSlug.trim().toLowerCase() },
        select: { id: true },
      });
      if (sch) targetSchoolId = sch.id;
    }

    const requestedRole = dto.portalRole ? String(dto.portalRole).trim().toUpperCase() : null;

    let roleFilter: any = {};
    if (requestedRole === 'SCHOOL_ADMIN' || requestedRole === 'ADMIN') {
      roleFilter = { role: { in: ['SCHOOL_ADMIN', 'ADMIN', 'SUPER_ADMIN'] } };
    } else if (requestedRole === 'TEACHER') {
      roleFilter = { role: 'TEACHER' };
    } else if (requestedRole === 'STUDENT') {
      roleFilter = { role: 'STUDENT' };
    }

    let user: any = null;

    // 1. Direct User lookup by email/identifier respecting roleFilter
    user = await this.prisma.user.findFirst({
      where: {
        ...roleFilter,
        OR: [
          { email: { equals: rawIdentifier, mode: 'insensitive' } },
          { email: { equals: `${rawIdentifier}@school.edu`, mode: 'insensitive' } },
          { email: { equals: `${cleanId}@school.edu`, mode: 'insensitive' } },
          { phone: rawIdentifier },
        ],
        ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
      },
      include: userInclude,
    });

    if (!user) {
      user = await this.prisma.user.findFirst({
        where: {
          ...roleFilter,
          OR: [
            { email: { equals: rawIdentifier, mode: 'insensitive' } },
            { email: { equals: `${rawIdentifier}@school.edu`, mode: 'insensitive' } },
            { email: { equals: `${cleanId}@school.edu`, mode: 'insensitive' } },
            { phone: rawIdentifier },
          ],
        },
        include: userInclude,
      });
    }

    // Login identifiers must be stable and tenant-safe. Do not authenticate by
    // display names, first names, school names/slugs, or partial numeric matches.
    // Those values are not unique credentials and can cause ambiguous or cross-tenant
    // account resolution. Supported identifiers are exact email/login IDs, phone,
    // teacher employee numbers, and student admission/B-Form numbers.
    if (!user && rawIdentifier && (requestedRole === 'SCHOOL_ADMIN' || requestedRole === 'ADMIN' || !requestedRole)) {
      user = await this.prisma.user.findFirst({
        where: {
          role: { in: ['SCHOOL_ADMIN', 'ADMIN', 'SUPER_ADMIN'] },
          deletedAt: null,
          OR: [{ email: { equals: rawIdentifier, mode: 'insensitive' } }, { phone: rawIdentifier }],
          ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
        },
        include: userInclude,
      });
    }

    if (!user && rawIdentifier && (requestedRole === 'TEACHER' || !requestedRole)) {
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { email: { equals: rawIdentifier, mode: 'insensitive' } },
            { employeeNo: { equals: rawIdentifier, mode: 'insensitive' } },
            { phone: rawIdentifier },
          ],
          ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
        },
        select: { email: true, schoolId: true },
      });
      if (teacher?.email) {
        user = await this.prisma.user.findFirst({
          where: {
            role: 'TEACHER',
            email: { equals: teacher.email, mode: 'insensitive' },
            schoolId: teacher.schoolId,
            deletedAt: null,
          },
          include: userInclude,
        });
      }
    }

    if (!user && rawIdentifier && (requestedRole === 'STUDENT' || !requestedRole)) {
      const student = await this.prisma.student.findFirst({
        where: {
          OR: [
            { admissionNo: { equals: rawIdentifier, mode: 'insensitive' } },
            { email: { equals: rawIdentifier, mode: 'insensitive' } },
            { phone: rawIdentifier },
            { bFormNumber: rawIdentifier },
          ],
          deletedAt: null,
          ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
        },
        select: { admissionNo: true, email: true, schoolId: true },
      });

      if (student) {
        const studentEmail = student.email ||
          `${student.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu`;
        user = await this.prisma.user.findFirst({
          where: {
            role: 'STUDENT',
            schoolId: student.schoolId,
            OR: [
              { email: { equals: studentEmail, mode: Prisma.QueryMode.insensitive } },
              ...(student.email ? [{ email: { equals: student.email, mode: Prisma.QueryMode.insensitive } }] : []),
            ],
            deletedAt: null,
          },
          include: userInclude,
        });
      }

      // Some existing student accounts use the generated school email directly.
      if (!user && cleanId.length >= 4) {
        user = await this.prisma.user.findFirst({
          where: {
            role: 'STUDENT',
            email: { equals: `${cleanId}@school.edu`, mode: 'insensitive' },
            ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
            deletedAt: null,
          },
          include: userInclude,
        });
      }
    }

    if (!user)
      throw new UnauthorizedException('No account found for this Login ID or email');

    // A supplied school slug is an explicit tenant boundary. Never accept a
    // matching account found by a later global fallback from another school.
    if (dto.schoolSlug) {
      const requestedSlug = dto.schoolSlug.trim().toLowerCase();
      if (!user.school || user.school.slug !== requestedSlug) {
        throw new UnauthorizedException('This account does not belong to the selected school');
      }
    }

    if (user.role === 'PARENT')
      throw new UnauthorizedException(
        'Parent accounts do not have portal login access',
      );

    if (requestedRole) {
      if (requestedRole === 'TEACHER' && user.role !== 'TEACHER') {
        throw new UnauthorizedException('This login is strictly for Teachers. For School Admin or Student access, please switch to the correct portal.');
      }
      if (requestedRole === 'STUDENT' && user.role !== 'STUDENT') {
        throw new UnauthorizedException('This LMS login is strictly for Students. For Teacher or School Admin access, please switch to the correct portal.');
      }
      if ((requestedRole === 'SCHOOL_ADMIN' || requestedRole === 'ADMIN') && !['SCHOOL_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new UnauthorizedException('This login is strictly for School Administrators. Teachers and Students must use their respective portals.');
      }
    }

    const pendingRequest =
      user.role === 'SCHOOL_ADMIN' && user.school
        ? await this.prisma.schoolRequest.findFirst({
            where: { email: user.email, status: 'PENDING' },
            select: { id: true },
          })
        : null;
    if (user.school && !user.school.isActive && !pendingRequest) {
      const schoolDetails = user.schoolId
        ? await this.prisma.school.findUnique({
            where: { id: user.schoolId },
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              country: true,
            },
          })
        : null;

      const activeAlert = user.schoolId
        ? await (this.prisma as any).schoolAlert.findFirst({
            where: { schoolId: user.schoolId, isActive: true },
            orderBy: { createdAt: 'desc' },
          })
        : null;

      const adminUser = user.schoolId
        ? await this.prisma.user.findFirst({
            where: { schoolId: user.schoolId, role: 'SCHOOL_ADMIN', deletedAt: null },
            select: { name: true, email: true, phone: true },
          })
        : null;

      throw new HttpException(
        {
          statusCode: 403,
          message: activeAlert?.message || 'This school portal is temporarily offline or suspended.',
          isSchoolOffline: true,
          school: schoolDetails || {
            name: user.school.name,
            slug: user.school.slug,
          },
          adminContact: {
            name: adminUser?.name || 'School Administration',
            email: adminUser?.email || schoolDetails?.email || 'admin@schoolos.app',
            phone: adminUser?.phone || schoolDetails?.phone || '+92 300 0000000',
            address: schoolDetails?.address || (schoolDetails?.city ? `${schoolDetails.city}, Pakistan` : 'Campus Address'),
          },
          notice: activeAlert || {
            type: 'SUSPENSION',
            title: 'School Portal Offline',
            message: 'This school portal is currently offline by platform administration.',
          },
        },
        HttpStatus.FORBIDDEN,
      );
    }
    if (!(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('Invalid Login ID or password');
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before signing in');
    }
    const subscription = user.school?.subscription;
    if (
      subscription &&
      subscription.status !== 'PENDING' &&
      (subscription.status === 'EXPIRED' || subscription.endDate < new Date())
    )
      throw new UnauthorizedException(
        'Your subscription has expired. Please renew your plan.',
      );
    const now = new Date();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.schoolId ?? undefined,
    );
    const activationStatus = user.school
      ? subscription?.status === 'ACTIVE' && subscription.endDate > now
        ? 'ACTIVE'
        : ['STUDENT', 'TEACHER'].includes(user.role) && user.school.isActive
          ? 'ACTIVE'
          : 'PAYMENT_PENDING'
      : 'ACTIVE';
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.school?.name,
        schoolSlug: user.school?.slug,
        activationStatus,
        plan: subscription?.plan,
        phone: user.phone,
        lastLoginAt: now,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            school: {
              select: {
                isActive: true,
                subscription: { select: { status: true, endDate: true } },
              },
            },
          },
        },
      },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date())
      throw new UnauthorizedException('Invalid or expired refresh token');
    if (stored.user.role === 'PARENT')
      throw new UnauthorizedException(
        'Parent accounts do not have portal login access',
      );
    const subscription = stored.user.school?.subscription;
    const expired =
      subscription &&
      subscription.status !== 'PENDING' &&
      (subscription.status === 'EXPIRED' || subscription.endDate < new Date());
    const pendingRequest =
      stored.user.role === 'SCHOOL_ADMIN' && stored.user.schoolId
        ? await this.prisma.schoolRequest.findFirst({
            where: { email: stored.user.email, status: 'PENDING' },
            select: { id: true },
          })
        : null;
    const inactiveAccount = !stored.user.isActive;
    const inactiveSchool = Boolean(
      stored.user.school && !stored.user.school.isActive,
    );
    if ((inactiveAccount || inactiveSchool || expired) && !pendingRequest)
      throw new UnauthorizedException('Account or subscription is inactive');
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      stored.user.schoolId ?? undefined,
    );
  }

  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user)
      return { message: 'If that email exists, a reset link has been sent' };
    if (user.role === 'PARENT')
      return { message: 'If that email exists, a reset link has been sent' };
    const token = uuidv4();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await this.mailService.sendPasswordReset(user.email, token);
    return { message: 'If that email exists, a reset link has been sent' };
  }
  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });
    if (!record || record.expiresAt < new Date() || record.usedAt)
      throw new BadRequestException('Invalid or expired reset token');
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { message: 'Password reset successfully' };
  }

  async submitOnboardingPayment(
    dto: OnboardingPaymentDto,
    user: Pick<JwtPayload, 'schoolId' | 'role'>,
  ) {
    if (user.schoolId !== dto.schoolId || user.role !== 'SCHOOL_ADMIN')
      throw new UnauthorizedException(
        'You can only submit payment for your school',
      );
    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
      include: { subscription: true },
    });
    if (!school) throw new BadRequestException('School account not found');
    const publicPlanKey = 'PROFESSIONAL';
    const plan = await this.prisma.platformPlan.findUnique({
      where: { planKey: publicPlanKey },
    });
    if (!plan || !plan.isActive)
      throw new BadRequestException(
        'The Professional subscription plan is unavailable',
      );
    if (Number(plan.price) <= 0)
      throw new BadRequestException(
        'This plan does not require a payment submission',
      );
    const allowedMethods = new Set(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'ONLINE']);
    const method = String(dto.method || '').trim().toUpperCase();
    if (!allowedMethods.has(method))
      throw new BadRequestException('Invalid payment method');
    const amount = dto.amount == null ? Number(plan.price) : Number(dto.amount);
    if (!Number.isFinite(amount) || amount !== Number(plan.price))
      throw new BadRequestException(
        `Payment amount must exactly match the ${plan.name} plan price`,
      );
    if (dto.screenshotUrl && dto.screenshotUrl.length > 2_800_000)
      throw new BadRequestException(
        'Payment screenshot must be 2 MB or smaller',
      );
    return this.prisma.$transaction(async (tx) => {
      const pendingPayment = await tx.onboardingPayment.findFirst({
        where: { schoolId: dto.schoolId, status: 'PENDING' },
        select: { id: true },
      });
      if (pendingPayment)
        throw new ConflictException(
          'A payment is already pending review for this school',
        );
      const payment = await tx.onboardingPayment.create({
        data: {
          schoolId: dto.schoolId,
          plan: plan.planKey,
          amount: plan.price,
          method,
          reference: dto.reference?.trim() || null,
          screenshotUrl: dto.screenshotUrl || null,
        },
      });
      const now = new Date();
      const currentSubscription = school.subscription;
      const activeUnexpired =
        school.isActive &&
        currentSubscription?.status === 'ACTIVE' &&
        currentSubscription.endDate > now;
      if (!activeUnexpired)
        await tx.subscription.update({
          where: { schoolId: dto.schoolId },
          data: {
            plan: plan.planKey,
            amount: plan.price,
            currency: plan.currency,
            status: 'PENDING',
          },
        });
      await tx.school.update({
        where: { id: dto.schoolId },
        data: { isActive: false },
      });
      const schoolUsers = await tx.user.findMany({
        where: { schoolId: dto.schoolId },
        select: { id: true },
      });
      await tx.user.updateMany({
        where: { schoolId: dto.schoolId, role: 'SCHOOL_ADMIN' },
        data: { isActive: false },
      });
      await tx.refreshToken.updateMany({
        where: {
          userId: { in: schoolUsers.map((u) => u.id) },
          revokedAt: null,
        },
        data: { revokedAt: now },
      });
      return payment;
    });
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        schoolId: true,
        lastLoginAt: true,
        isActive: true,
        emailVerified: true,
        school: {
          select: {
            name: true,
            slug: true,
            isActive: true,
            subscription: { select: { plan: true, status: true, endDate: true } },
          },
        },
      },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('User account is unavailable');

    const subscription = user.school?.subscription;
    const now = new Date();
    const activationStatus = user.school
      ? subscription?.status === 'ACTIVE' && subscription.endDate > now
        ? 'ACTIVE'
        : 'PAYMENT_PENDING'
      : 'ACTIVE';

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        schoolId: user.schoolId,
        schoolName: user.school?.name,
        schoolSlug: user.school?.slug,
        activationStatus,
        plan: subscription?.plan,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name.trim(), phone: dto.phone?.trim() || null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        schoolId: true,
        lastLoginAt: true,
      },
    });
  }
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      !(await bcrypt.compare(dto.currentPassword, user.passwordHash))
    )
      throw new UnauthorizedException('Current password is incorrect');
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Password changed successfully. Please sign in again.' };
  }
  private calculateEndDate(start: Date, period: string): Date {
    const normalized = (period || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ');
    if (!normalized)
      throw new BadRequestException(
        'Subscription plan period is not configured',
      );
    if (
      normalized === 'forever' ||
      normalized === 'unlimited' ||
      normalized.includes('forever')
    )
      return new Date(FOREVER_DATE);
    if (normalized.includes('trial'))
      return new Date(start.getTime() + 3 * DAY_MS);
    if (
      /^(per\s+)?month(ly)?$/.test(normalized) ||
      normalized === 'per month'
    ) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return end;
    }
    const monthMatch = normalized.match(/(?:every\s+|per\s+)?(\d+)\s*months?/);
    if (monthMatch) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + Number(monthMatch[1]));
      return end;
    }
    if (/^(per\s+)?day(s)?$/.test(normalized))
      return new Date(start.getTime() + DAY_MS);
    const dayMatch = normalized.match(/(?:every\s+|per\s+)?(\d+)\s*days?/);
    if (dayMatch)
      return new Date(start.getTime() + Number(dayMatch[1]) * DAY_MS);
    if (
      /^(per\s+)?year(ly|ly)?$/.test(normalized) ||
      normalized === 'annual' ||
      normalized === 'per year'
    ) {
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      return end;
    }
    const yearMatch = normalized.match(/(?:every\s+|per\s+)?(\d+)\s*years?/);
    if (yearMatch) {
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + Number(yearMatch[1]));
      return end;
    }
    throw new BadRequestException(`Unsupported subscription period: ${period}`);
  }
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    schoolId?: string,
  ) {
    const payload = { sub: userId, email, role, schoolId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
    });
    const refreshToken = uuidv4();
    const expiresAt = new Date(
      Date.now() + parseDurationMs(this.configService.get('JWT_REFRESH_EXPIRATION'), '7d'),
    );
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });
    return { accessToken, refreshToken };
  }
}
