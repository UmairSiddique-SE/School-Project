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
import {
  LoginDto,
  RegisterSchoolDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ─── Register School + Admin ────────────────────────────────────────────────
  async registerSchool(dto: RegisterSchoolDto) {
    // Check slug uniqueness
    const existingSchool = await this.prisma.school.findUnique({
      where: { slug: dto.schoolSlug },
    });
    if (existingSchool) {
      throw new ConflictException('A school with this slug already exists');
    }

    // Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    // Transaction: create school + admin user atomically
    const result = await this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: dto.schoolName,
          slug: dto.schoolSlug,
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          name: dto.adminName,
          email: dto.adminEmail,
          passwordHash,
          role: 'SCHOOL_ADMIN',
          schoolId: school.id,
        },
      });

      return { school, user };
    });

    const tokens = await this.generateTokens(
      result.user.id,
      result.user.email,
      result.user.role,
      result.user.schoolId ?? undefined,
    );

    return {
      message: 'School registered successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        schoolId: result.user.schoolId,
        schoolName: result.school.name,
        schoolSlug: result.school.slug,
      },
      ...tokens,
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { school: { select: { name: true, slug: true } } },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is suspended');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.schoolId ?? undefined,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.school?.name,
        schoolSlug: user.school?.slug,
      },
      ...tokens,
    };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────
  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke the old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      stored.user.schoolId ?? undefined,
    );

    return tokens;
  }

  // ─── Logout ──────────────────────────────────────────────────────────────
  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Always return success to prevent user enumeration
    if (!user)
      return { message: 'If that email exists, a reset link has been sent' };

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    await this.mailService.sendPasswordReset(user.email, token);

    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ─── Reset Password ──────────────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

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
    ]);

    return { message: 'Password reset successfully' };
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────
  async verifyEmail(dto: VerifyEmailDto) {
    const record = await this.prisma.emailVerification.findFirst({
      where: { userId: dto.userId, otp: dto.otp, usedAt: null },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

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

    return { message: 'Email verified successfully' };
  }

  // ─── Token Generation ─────────────────────────────────────────────────────
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
