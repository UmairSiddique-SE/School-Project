import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { LoginDto, RegisterSchoolDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, OnboardingPaymentDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../mail/mail.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly configService: ConfigService, private readonly mailService: MailService) {}

  async registerSchool(dto: RegisterSchoolDto) {
    const existingSchool = await this.prisma.school.findUnique({ where: { slug: dto.schoolSlug } });
    if (existingSchool) throw new ConflictException('A school with this slug already exists');
    const email = dto.adminEmail.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const result = await this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({ data: { name: dto.schoolName, slug: dto.schoolSlug, type: dto.schoolType, logoUrl: dto.logoUrl, phone: dto.schoolPhone || dto.adminPhone, address: dto.schoolAddress, country: dto.country, city: dto.city, isActive: false } });
      const user = await tx.user.create({ data: { name: dto.adminName, email, passwordHash, role: 'SCHOOL_ADMIN', schoolId: school.id, phone: dto.adminPhone } });
      await tx.subscription.create({ data: { schoolId: school.id, plan: dto.requestedPlan || 'FREE_TRIAL', status: 'PENDING', endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), amount: 0 } });
      await tx.emailVerification.create({ data: { userId: user.id, otp, expiresAt: new Date(Date.now() + 15 * 60 * 1000) } });
      return { school, user };
    });
    await this.mailService.sendEmailVerification(result.user.email, otp);
    return { message: 'School registered. Verify your email to continue.', verificationRequired: true, verificationUserId: result.user.id, user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, schoolId: result.user.schoolId, schoolName: result.school.name, schoolSlug: result.school.slug } };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() }, include: { school: { select: { name: true, slug: true, isActive: true, subscription: { select: { plan: true, status: true } } } } } });
    if (!user) throw new UnauthorizedException('No account found for this email address');
    if (!user.isActive) throw new UnauthorizedException('This account has been suspended');
    if (user.school && !user.school.isActive) throw new UnauthorizedException('This school account is suspended or awaiting payment approval');
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    if (!user.emailVerified) throw new UnauthorizedException('Please verify your email before signing in');
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId ?? undefined);
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role, schoolId: user.schoolId, schoolName: user.school?.name, schoolSlug: user.school?.slug, activationStatus: user.school?.isActive ? 'ACTIVE' : 'PAYMENT_PENDING', plan: user.school?.subscription?.plan }, ...tokens };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token }, include: { user: { include: { school: { select: { isActive: true } } } } } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive || (stored.user.schoolId && !stored.user.school?.isActive)) throw new UnauthorizedException('Invalid or expired refresh token');
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.generateTokens(stored.user.id, stored.user.email, stored.user.role, stored.user.schoolId ?? undefined);
  }

  async logout(token: string) { await this.prisma.refreshToken.updateMany({ where: { token, revokedAt: null }, data: { revokedAt: new Date() } }); return { message: 'Logged out successfully' }; }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user) return { message: 'If that email exists, a reset link has been sent' };
    const token = uuidv4();
    await this.prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await this.mailService.sendPasswordReset(user.email, token);
    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token: dto.token } });
    if (!record || record.expiresAt < new Date() || record.usedAt) throw new BadRequestException('Invalid or expired reset token');
    await this.prisma.$transaction([this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) } }), this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }), this.prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } })]);
    return { message: 'Password reset successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const record = await this.prisma.emailVerification.findFirst({ where: { userId: dto.userId, otp: dto.otp, usedAt: null } });
    if (!record || record.expiresAt < new Date()) throw new BadRequestException('Invalid or expired OTP');
    await this.prisma.$transaction([this.prisma.user.update({ where: { id: dto.userId }, data: { emailVerified: true } }), this.prisma.emailVerification.update({ where: { id: record.id }, data: { usedAt: new Date() } })]);
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId }, include: { school: { select: { name: true, slug: true, isActive: true, subscription: { select: { plan: true, status: true } } } } } });
    if (!user) throw new BadRequestException('User account not found');
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId ?? undefined);
    return { message: 'Email verified successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role, schoolId: user.schoolId, schoolName: user.school?.name, schoolSlug: user.school?.slug, activationStatus: user.school?.isActive ? 'ACTIVE' : 'PAYMENT_PENDING', plan: user.school?.subscription?.plan }, ...tokens };
  }

  async submitOnboardingPayment(dto: OnboardingPaymentDto, user: Pick<JwtPayload, 'schoolId' | 'role'>) {
    if (user.schoolId !== dto.schoolId || user.role !== 'SCHOOL_ADMIN') throw new UnauthorizedException('You can only submit payment for your school');
    const school = await this.prisma.school.findUnique({ where: { id: dto.schoolId } });
    if (!school) throw new BadRequestException('School account not found');
    const plan = await this.prisma.platformPlan.findUnique({ where: { planKey: dto.plan } });
    if (!plan || !plan.isActive) throw new BadRequestException('Selected subscription plan is unavailable');
    const amount = Number(dto.amount ?? plan.price);
    if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException('A valid payment amount is required');
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.onboardingPayment.create({ data: { schoolId: dto.schoolId, plan: dto.plan, amount, method: dto.method, reference: dto.reference, screenshotUrl: dto.screenshotUrl || null } });
      await tx.subscription.update({ where: { schoolId: dto.schoolId }, data: { plan: dto.plan, amount, currency: plan.currency, status: 'PENDING' } });
      return payment;
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) { return this.prisma.user.update({ where: { id: userId }, data: { name: dto.name.trim(), phone: dto.phone?.trim() || null }, select: { id: true, name: true, email: true, role: true, phone: true, schoolId: true } }); }
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) throw new UnauthorizedException('Current password is incorrect');
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) } });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { message: 'Password changed successfully. Please sign in again.' };
  }

  private async generateTokens(userId: string, email: string, role: string, schoolId?: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role, schoolId }, { expiresIn: this.configService.get('JWT_EXPIRATION') || '15m' });
    const refreshToken = uuidv4();
    await this.prisma.refreshToken.create({ data: { token: refreshToken, userId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return { accessToken, refreshToken };
  }
}
