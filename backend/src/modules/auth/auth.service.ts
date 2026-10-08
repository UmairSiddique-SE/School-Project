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
import {
  LoginDto,
  RegisterSchoolDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  OnboardingPaymentDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';
import { MailService } from '../mail/mail.service';
import { MediaService } from '../media/media.service';
import { JwtPayload } from './strategies/jwt.strategy';

const DAY_MS = 24 * 60 * 60 * 1000;
const FOREVER_DATE = new Date('9999-12-31T23:59:59.999Z');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly mediaService: MediaService,
  ) {}

  async registerSchool(dto: RegisterSchoolDto) {
    try {
      const schoolSlug = dto.schoolSlug.trim().toLowerCase();
      const adminEmail = dto.adminEmail.trim().toLowerCase();
      const existingSchool = await this.prisma.school.findUnique({
        where: { slug: schoolSlug },
      });
      if (existingSchool)
        throw new ConflictException('A school with this slug already exists');
      const existingUser = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });
      if (existingUser) throw new ConflictException('Email already registered');
      const planKey = dto.requestedPlan || 'FREE_TRIAL';
      const plan = await this.prisma.platformPlan.findUnique({
        where: { planKey },
      });
      if (!plan || !plan.isActive)
        throw new BadRequestException(
          'Selected subscription plan is unavailable',
        );
      const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
      const otp = String(randomInt(100000, 1000000));
      const result = await this.prisma.$transaction(
      async (tx) => {
            const school = await tx.school.create({
          data: {
            name: dto.schoolName.trim(),
            slug: schoolSlug,
            type: dto.schoolType,
            logoUrl: dto.logoUrl,
            phone: dto.schoolPhone || dto.adminPhone,
            address: dto.schoolAddress,
            country: dto.country,
            city: dto.city,
            isActive: true,
          },
        });
        const user = await tx.user.create({
          data: {
            name: dto.adminName.trim(),
            email: adminEmail,
            passwordHash,
            role: 'SCHOOL_ADMIN',
            schoolId: school.id,
            phone: dto.adminPhone,
          },
        });
        const endDate = this.calculateEndDate(new Date(), plan.period);
        await tx.subscription.create({
          data: {
            schoolId: school.id,
            plan: plan.planKey,
            status: 'PENDING',
            endDate,
            amount: plan.price,
            currency: plan.currency,
          },
        });
        await tx.schoolRequest.create({
          data: {
            schoolName: school.name,
            ownerName: user.name,
            email: adminEmail,
            phone: dto.adminPhone || dto.schoolPhone || null,
            whatsapp: dto.adminPhone || null,
            city: dto.city || null,
            address: dto.schoolAddress || null,
            subdomain: schoolSlug,
            requestedPlan: plan.planKey,
            status: 'PENDING',
          },
        });
        await tx.emailVerification.create({
          data: {
            userId: user.id,
            otp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
return { school, user };
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );     
      if (typeof dto.logoUrl === 'string' && dto.logoUrl.startsWith('data:image/')) {
        const match = dto.logoUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
        if (!match) throw new BadRequestException('School logo must be a valid PNG, JPG, or WEBP image');
        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.length > 2 * 1024 * 1024) throw new BadRequestException('School logo must be 2 MB or smaller');
        const uploaded = await this.mediaService.uploadImage(
          {
            buffer,
            mimetype: match[1],
            size: buffer.length,
            originalname: 'school-logo',
            fieldname: 'file',
            encoding: '7bit',
            destination: '',
            filename: 'school-logo',
            path: '',
            stream: undefined as any,
          } as any,
          result.school.id,
          'school-logo',
        );
        await this.prisma.school.update({
          where: { id: result.school.id },
          data: { logoUrl: uploaded.url },
        });
        result.school.logoUrl = uploaded.url;
      }

      this.mailService
        .sendEmailVerification(result.user.email, otp)
        .catch((error) =>
          console.error('Failed to send verification email:', error),
        );
      return {
        message: 'School registered. Verify your email to continue.',
        verificationRequired: true,
        verificationUserId: result.user.id,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          schoolId: result.user.schoolId,
          schoolName: result.school.name,
          schoolSlug: result.school.slug,
        },
      };
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;
      console.error('Error in registerSchool:', error);
      throw new BadRequestException(
        error?.message || 'Failed to register school',
      );
    }
  }

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

    // 2. School Admin Resolution (if SCHOOL_ADMIN requested or no role specified)
    if (!user && rawIdentifier && (requestedRole === 'SCHOOL_ADMIN' || requestedRole === 'ADMIN' || !requestedRole)) {
      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: { in: ['SCHOOL_ADMIN', 'ADMIN', 'SUPER_ADMIN'] },
          deletedAt: null,
          ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
        },
        include: userInclude,
      });

      const matchedAdmin = adminUsers.find((adm) => {
        if (!adm) return false;
        if (adm.email.toLowerCase() === identifier) return true;
        if (adm.phone && adm.phone.replace(/\D/g, '') === cleanId && cleanId.length >= 7) return true;
        const nameClean = (adm.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const firstName = (adm.name || '').trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
        if (cleanId && (cleanId === nameClean || cleanId === firstName)) return true;
        if (cleanId === 'admin') return true;
        if (adm.school?.slug && cleanId === adm.school.slug.replace(/[^a-z0-9]/g, '')) return true;
        return false;
      });

      if (matchedAdmin) {
        user = matchedAdmin;
      }
    }

    // 3. Teacher Resolution (if TEACHER requested or no role specified)
    if (!user && rawIdentifier && (requestedRole === 'TEACHER' || !requestedRole)) {
      const teachers = await this.prisma.teacher.findMany({
        where: {
          deletedAt: null,
          ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
        },
        select: { id: true, name: true, employeeNo: true, email: true, phone: true, schoolId: true },
      });

      const matchedTeacher = teachers.find((t) => {
        if (!t) return false;
        if (t.email && t.email.toLowerCase() === identifier) return true;
        if (t.employeeNo && t.employeeNo.toLowerCase() === identifier) return true;
        if (t.phone && t.phone.replace(/\D/g, '') === cleanId && cleanId.length >= 7) return true;

        const empClean = (t.employeeNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (empClean && empClean === cleanId) return true;

        const regDigits = (t.employeeNo || '').replace(/\D/g, '');
        const shortRegDigits = regDigits.slice(-3); // e.g. "001" from "EMP-2026-001"
        const firstName = (t.name || '').trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
        const fullNameClean = (t.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        if (firstName && shortRegDigits && (cleanId === `${firstName}${shortRegDigits}` || identifier === `${firstName}-${shortRegDigits}`)) return true;
        if (firstName && regDigits && (cleanId === `${firstName}${regDigits}` || cleanId === `${firstName}${empClean}`)) return true;
        if (fullNameClean && shortRegDigits && cleanId === `${fullNameClean}${shortRegDigits}`) return true;
        if (fullNameClean && regDigits && cleanId === `${fullNameClean}${regDigits}`) return true;

        if (shortRegDigits && (cleanId === shortRegDigits || cleanId === regDigits) && cleanId.length >= 2) return true;
        if (firstName && cleanId === firstName) return true;
        if (fullNameClean && cleanId === fullNameClean) return true;

        return false;
      });

      if (matchedTeacher?.email) {
        user = await this.prisma.user.findFirst({
          where: { role: 'TEACHER', email: { equals: matchedTeacher.email, mode: 'insensitive' } },
          include: userInclude,
        });

        if (!user && matchedTeacher.schoolId) {
          user = await this.prisma.user.findFirst({
            where: {
              schoolId: matchedTeacher.schoolId,
              role: 'TEACHER',
              name: { equals: matchedTeacher.name, mode: 'insensitive' },
              deletedAt: null,
            },
            include: userInclude,
          });
        }
      }
    }

    // 4. Student Resolution (if STUDENT requested or no role specified)
    if (!user && rawIdentifier && (requestedRole === 'STUDENT' || !requestedRole)) {
      let student = await this.prisma.student.findFirst({
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
      });

      if (!student) {
        const students = await this.prisma.student.findMany({
          where: {
            deletedAt: null,
            ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
          },
          select: { id: true, name: true, admissionNo: true, rollNo: true, email: true, phone: true, bFormNumber: true, schoolId: true },
        });

        student = students.find((s) => {
          if (!s) return false;
          if (s.email && s.email.toLowerCase() === identifier) return true;
          if (s.admissionNo && s.admissionNo.toLowerCase() === identifier) return true;
          if (s.phone && s.phone.replace(/\D/g, '') === cleanId && cleanId.length >= 7) return true;
          if (s.bFormNumber && s.bFormNumber.replace(/\D/g, '') === cleanId && cleanId.length >= 7) return true;

          const admClean = (s.admissionNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (admClean && admClean === cleanId) return true;

          const admDigits = (s.admissionNo || '').replace(/\D/g, '');
          const lastNumSeq = parseInt((s.admissionNo || '').split('-').pop() || '', 10);
          const shortDigits = isNaN(lastNumSeq) ? admDigits.slice(-3) : String(lastNumSeq); // e.g. "1" from "ADM-2026-0001"
          const padDigits = isNaN(lastNumSeq) ? '' : String(lastNumSeq).padStart(4, '0'); // e.g. "0001"

          const firstName = (s.name || '').trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
          const fullNameClean = (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

          // Match Student Name + Last Registration Number combinations (e.g. umair1, hannan2, hannan4, haider3, ammar5, ali20, ali100)
          if (firstName && shortDigits && (cleanId === `${firstName}${shortDigits}` || identifier === `${firstName}-${shortDigits}`)) return true;
          if (firstName && padDigits && (cleanId === `${firstName}${padDigits}` || identifier === `${firstName}-${padDigits}`)) return true;
          if (firstName && admDigits && cleanId === `${firstName}${admDigits}`) return true;
          if (fullNameClean && shortDigits && cleanId === `${fullNameClean}${shortDigits}`) return true;
          if (fullNameClean && padDigits && cleanId === `${fullNameClean}${padDigits}`) return true;
          if (fullNameClean && admDigits && cleanId === `${fullNameClean}${admDigits}`) return true;

          // Match pure sequence digits: e.g. entering "1" or "0001" or "01"
          if (shortDigits && cleanId === shortDigits) return true;
          if (padDigits && cleanId === padDigits) return true;
          if (admDigits && admDigits.length >= 3 && cleanId === admDigits) return true;

          // Roll number match if prefixed with name
          if (s.rollNo && (cleanId === `${firstName}${s.rollNo}` || identifier === `${firstName}-${s.rollNo}`)) return true;

          // Name match if unique
          if (firstName && cleanId === firstName) return true;
          if (fullNameClean && cleanId === fullNameClean) return true;

          return false;
        }) as any;
      }

      if (student) {
        if (student.email) {
          user = await this.prisma.user.findFirst({
            where: { role: 'STUDENT', email: { equals: student.email, mode: 'insensitive' } },
            include: userInclude,
          });
        }
        if (!user && student.admissionNo) {
          const cleanAdm = student.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '');
          user = await this.prisma.user.findFirst({
            where: {
              role: 'STUDENT',
              OR: [
                { email: { equals: `${cleanAdm}@school.edu`, mode: 'insensitive' } },
                { schoolId: student.schoolId, name: { equals: student.name, mode: 'insensitive' } },
              ],
            },
            include: userInclude,
          });
        }
      }

      // Fallback for generated student email templates (e.g. adm20260001 -> adm20260001@school.edu)
      if (!user && cleanId.length >= 4) {
        user = await this.prisma.user.findFirst({
          where: {
            role: 'STUDENT',
            OR: [
              { email: { equals: `${cleanId}@school.edu`, mode: 'insensitive' } },
              { email: { startsWith: cleanId, mode: 'insensitive' } },
            ],
            ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
          },
          include: userInclude,
        });
      }

      // Legacy format: first123@student.schoolslug.pk
      if (!user && identifier.includes('@student.')) {
        const match = identifier.match(
          /^([a-z0-9]+?)(\d+)@student\.([a-z0-9-]+)\.pk$/i,
        );
        if (match) {
          const [, firstName, admissionSuffix, schoolSlug] = match;
          const school = await this.prisma.school.findUnique({
            where: { slug: schoolSlug },
            select: { id: true },
          });
          if (school) {
            const students = await this.prisma.student.findMany({
              where: { schoolId: school.id, deletedAt: null },
              select: { admissionNo: true, name: true, email: true },
            });
            const st = students.find((s) => {
              const nameFirst = s.name
                .trim()
                .split(/\s+/)[0]
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
              const suffix =
                s.admissionNo.match(/(\d+)$/)?.[1] ||
                s.admissionNo.replace(/\D/g, '');
              return (
                nameFirst === firstName.toLowerCase() &&
                suffix === admissionSuffix
              );
            });
            if (st?.email) {
              user = await this.prisma.user.findFirst({
                where: { role: 'STUDENT', email: { equals: st.email, mode: 'insensitive' } },
                include: userInclude,
              });
            }
          }
        }
      }
    }

    if (!user)
      throw new UnauthorizedException('No account found for this Login ID or email');
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
            email: adminUser?.email || schoolDetails?.email || 'admin@edusphere.pk',
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
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      user.emailVerified = true;
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

  async verifyEmail(dto: VerifyEmailDto) {
    const record = await this.prisma.emailVerification.findFirst({
      where: { userId: dto.userId, otp: dto.otp, usedAt: null },
    });
    if (!record || record.expiresAt < new Date())
      throw new BadRequestException('Invalid or expired OTP');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: dto.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: {
        school: {
          select: {
            name: true,
            slug: true,
            isActive: true,
            subscription: {
              select: { plan: true, status: true, endDate: true },
            },
          },
        },
      },
    });
    if (!user) throw new BadRequestException('User account not found');
    if (user.role === 'PARENT')
      throw new UnauthorizedException(
        'Parent accounts do not have portal login access',
      );
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.schoolId ?? undefined,
    );
    const activationStatus = user.school
      ? user.school.subscription?.status === 'ACTIVE' &&
        user.school.subscription.endDate > new Date()
        ? 'ACTIVE'
        : 'PAYMENT_PENDING'
      : 'ACTIVE';
    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.school?.name,
        schoolSlug: user.school?.slug,
        activationStatus,
        plan: user.school?.subscription?.plan,
      },
      ...tokens,
    };
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
    const plan = await this.prisma.platformPlan.findUnique({
      where: { planKey: dto.plan },
    });
    if (!plan || !plan.isActive)
      throw new BadRequestException(
        'Selected subscription plan is unavailable',
      );
    if (Number(plan.price) <= 0)
      throw new BadRequestException(
        'This plan does not require a payment submission',
      );
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
          method: dto.method,
          reference: dto.reference,
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
    const expiresAt = new Date(Date.now() + 7 * DAY_MS);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });
    return { accessToken, refreshToken };
  }
}
