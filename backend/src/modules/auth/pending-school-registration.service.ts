import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterSchoolDto } from './dto/auth.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const FOREVER_DATE = new Date('9999-12-31T23:59:59.999Z');

type PendingRow = { id: string; schoolName: string; schoolSlug: string; schoolType: string; logoUrl: string; schoolAddress: string; schoolPhone: string; country: string; city: string; adminName: string; adminEmail: string; adminPhone: string; passwordHash: string; requestedPlan: string; otp: string; otpExpiresAt: Date; verifiedAt: Date | null };

@Injectable()
export class PendingSchoolRegistrationService {
  constructor(private readonly prisma: PrismaService, private readonly mailService: MailService, private readonly jwtService: JwtService) {}
  private endDate(start: Date, period: string) {
    const normalized = (period || '').trim().toLowerCase();
    if (normalized.includes('trial')) return new Date(start.getTime() + 3 * DAY_MS);
    if (normalized.includes('forever') || normalized.includes('unlimited')) return new Date(FOREVER_DATE);
    const months = normalized.match(/(\d+)\s*months?/);
    if (months) { const end = new Date(start); end.setMonth(end.getMonth() + Number(months[1])); return end; }
    const end = new Date(start); end.setMonth(end.getMonth() + 1); return end;
  }
  private async findPending(id: string) {
    const rows = await this.prisma.$queryRaw<PendingRow[]>`SELECT "id", "schoolName", "schoolSlug", "schoolType", "logoUrl", "schoolAddress", "schoolPhone", "country", "city", "adminName", "adminEmail", "adminPhone", "passwordHash", "requestedPlan", "otp", "otpExpiresAt", "verifiedAt" FROM "PendingSchoolRegistration" WHERE "id" = ${id} LIMIT 1`;
    return rows[0] || null;
  }
  async register(dto: RegisterSchoolDto) {
    const schoolSlug = dto.schoolSlug.trim().toLowerCase();
    const adminEmail = dto.adminEmail.trim().toLowerCase();
    const planKey = dto.requestedPlan || 'FREE_TRIAL';
    const plan = await this.prisma.platformPlan.findUnique({ where: { planKey } });
    if (!plan || !plan.isActive) throw new BadRequestException('Selected subscription plan is unavailable');
    const existingSchool = await this.prisma.school.findUnique({ where: { slug: schoolSlug }, select: { id: true } });
    if (existingSchool) throw new ConflictException('A school with this slug already exists');
    const existingUser = await this.prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
    if (existingUser) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
    const otp = String(randomInt(100000, 1000000));
    const id = uuidv4();
    await this.prisma.$executeRaw`INSERT INTO "PendingSchoolRegistration" ("id", "schoolName", "schoolSlug", "schoolType", "logoUrl", "schoolAddress", "schoolPhone", "country", "city", "adminName", "adminEmail", "adminPhone", "passwordHash", "requestedPlan", "otp", "otpExpiresAt") VALUES (${id}, ${dto.schoolName.trim()}, ${schoolSlug}, ${dto.schoolType}, ${dto.logoUrl}, ${dto.schoolAddress}, ${dto.schoolPhone}, ${dto.country}, ${dto.city}, ${dto.adminName.trim()}, ${adminEmail}, ${dto.adminPhone}, ${passwordHash}, ${planKey}, ${otp}, ${new Date(Date.now() + 15 * 60 * 1000)}) ON CONFLICT ("schoolSlug") DO UPDATE SET "schoolName" = EXCLUDED."schoolName", "schoolType" = EXCLUDED."schoolType", "logoUrl" = EXCLUDED."logoUrl", "schoolAddress" = EXCLUDED."schoolAddress", "schoolPhone" = EXCLUDED."schoolPhone", "country" = EXCLUDED."country", "city" = EXCLUDED."city", "adminName" = EXCLUDED."adminName", "adminEmail" = EXCLUDED."adminEmail", "adminPhone" = EXCLUDED."adminPhone", "passwordHash" = EXCLUDED."passwordHash", "requestedPlan" = EXCLUDED."requestedPlan", "otp" = EXCLUDED."otp", "otpExpiresAt" = EXCLUDED."otpExpiresAt", "verifiedAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP`;
    const pending = await this.prisma.$queryRaw<PendingRow[]>`SELECT "id", "schoolName", "schoolSlug", "schoolType", "logoUrl", "schoolAddress", "schoolPhone", "country", "city", "adminName", "adminEmail", "adminPhone", "passwordHash", "requestedPlan", "otp", "otpExpiresAt", "verifiedAt" FROM "PendingSchoolRegistration" WHERE "schoolSlug" = ${schoolSlug} LIMIT 1`;
    const registration = pending[0];
    if (!registration) throw new BadRequestException('Unable to create registration session');
    const emailSent = await this.mailService.sendEmailVerification(adminEmail, otp);
    if (!emailSent) throw new BadRequestException('We could not send the verification email. Please check the mail configuration and try again.');
    return { message: 'School registration started. Verify your email to continue.', verificationRequired: true, verificationUserId: registration.id, schoolSlug: registration.schoolSlug, email: registration.adminEmail };
  }
  async resend(id: string) {
    const pending = await this.findPending(id);
    if (!pending) throw new BadRequestException('Registration session not found. Please register again.');
    if (pending.verifiedAt) throw new BadRequestException('Email is already verified.');
    const otp = String(randomInt(100000, 1000000));
    await this.prisma.$executeRaw`UPDATE "PendingSchoolRegistration" SET "otp" = ${otp}, "otpExpiresAt" = ${new Date(Date.now() + 15 * 60 * 1000)}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}`;
    const emailSent = await this.mailService.sendEmailVerification(pending.adminEmail, otp);
    if (!emailSent) throw new BadRequestException('We could not resend the verification email. Please try again.');
    return { message: 'A new verification code has been sent.', verificationUserId: id };
  }
  async verify(id: string, otp: string) {
    const pending = await this.findPending(id);
    if (!pending) return null;
    if (pending.verifiedAt) throw new BadRequestException('Email already verified. Please continue with your registration.');
    if (pending.otp !== otp.trim() || pending.otpExpiresAt < new Date()) throw new BadRequestException('Invalid or expired OTP. Please use the latest code or resend OTP.');
    const plan = await this.prisma.platformPlan.findUnique({ where: { planKey: pending.requestedPlan } });
    if (!plan || !plan.isActive) throw new BadRequestException('Selected subscription plan is unavailable');
    const result = await this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({ data: { name: pending.schoolName, slug: pending.schoolSlug, type: pending.schoolType, logoUrl: pending.logoUrl, phone: pending.schoolPhone, address: pending.schoolAddress, country: pending.country, city: pending.city, isActive: true } });
      const user = await tx.user.create({ data: { name: pending.adminName, email: pending.adminEmail, passwordHash: pending.passwordHash, role: 'SCHOOL_ADMIN', schoolId: school.id, phone: pending.adminPhone, emailVerified: true } });
      await tx.subscription.create({ data: { schoolId: school.id, plan: plan.planKey, status: 'PENDING', endDate: this.endDate(new Date(), plan.period), amount: plan.price, currency: plan.currency } });
      await tx.schoolRequest.create({ data: { schoolName: school.name, ownerName: user.name, email: user.email, phone: pending.adminPhone, whatsapp: pending.adminPhone, city: pending.city, address: pending.schoolAddress, subdomain: pending.schoolSlug, requestedPlan: plan.planKey, status: 'PENDING' } });
      await tx.$executeRaw`UPDATE "PendingSchoolRegistration" SET "verifiedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}`;
      return { school, user };
    });
    await this.prisma.$executeRaw`DELETE FROM "PendingSchoolRegistration" WHERE "id" = ${id}`;
    const accessToken = await this.jwtService.signAsync({ sub: result.user.id, email: result.user.email, role: result.user.role, schoolId: result.school.id });
    return { message: 'Email verified successfully', user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, schoolId: result.school.id, schoolName: result.school.name, schoolSlug: result.school.slug, activationStatus: 'PAYMENT_PENDING', plan: plan.planKey }, accessToken };
  }
}