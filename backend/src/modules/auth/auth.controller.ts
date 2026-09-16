import { Controller, Post, Body, Get, Patch, UseGuards, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterSchoolDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, RefreshTokenDto, OnboardingPaymentDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PendingSchoolRegistrationService } from './pending-school-registration.service';
import { SchoolRegistrationService } from './school-registration.service';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly pendingSchoolRegistrationService: PendingSchoolRegistrationService,
    private readonly schoolRegistrationService: SchoolRegistrationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register-school')
  registerSchool(@Body() dto: RegisterSchoolDto) { return this.schoolRegistrationService.register(dto); }

  @Post('login') @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Post('refresh') @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) { return this.authService.refreshToken(dto.refreshToken); }

  @Post('logout') @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) { return this.authService.logout(dto.refreshToken); }

  @Post('forgot-password') @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) { return this.authService.forgotPassword(dto); }

  @Post('reset-password') @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) { return this.authService.resetPassword(dto); }

  @Post('verify-email') @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const pendingResult = await this.pendingSchoolRegistrationService.verify(dto.userId, dto.otp);
    if (pendingResult) return pendingResult;
    const result = await this.authService.verifyEmail(dto);
    if (result.user?.role === 'SCHOOL_ADMIN' && result.user.activationStatus !== 'ACTIVE') {
      return { ...result, message: 'Email verified successfully. Continue onboarding; school portal access remains locked until Super Admin approval.', verificationRequired: false, approvalRequired: true };
    }
    return result;
  }

  @Post('resend-otp') @HttpCode(HttpStatus.OK)
  resendOtp(@Body() dto: { userId: string }) { return this.pendingSchoolRegistrationService.resend(dto.userId); }

  @Post('onboarding-payment') @UseGuards(JwtAuthGuard) @ApiBearerAuth() @HttpCode(HttpStatus.OK)
  submitOnboardingPayment(@Body() dto: OnboardingPaymentDto, @CurrentUser() user: any) { return this.authService.submitOnboardingPayment(dto, user); }

  @Get('onboarding/status') @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current school onboarding/approval status' })
  async onboardingStatus(@CurrentUser() user: any) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        schoolId: true,
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

    if (!dbUser) throw new ForbiddenException('User account is no longer available');

    const request = dbUser.schoolId
      ? await this.prisma.schoolRequest.findFirst({
          where: { email: dbUser.email },
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, requestedPlan: true, createdAt: true },
        })
      : null;

    const payment = dbUser.schoolId
      ? await this.prisma.onboardingPayment.findFirst({
          where: { schoolId: dbUser.schoolId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, plan: true, amount: true, method: true, reference: true, createdAt: true },
        })
      : null;

    const subscription = dbUser.school?.subscription;
    const status =
      subscription?.status === 'ACTIVE' && dbUser.school?.isActive
        ? 'APPROVED'
        : payment?.status === 'PENDING' || subscription?.status === 'PENDING'
          ? 'PENDING_APPROVAL'
          : request?.status === 'APPROVED'
            ? 'APPROVED'
            : request?.status === 'REJECTED'
              ? 'REJECTED'
              : 'PENDING';

    return {
      status,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        schoolId: dbUser.schoolId,
        isActive: dbUser.isActive,
      },
      school: dbUser.school,
      request,
      payment,
      subscription,
    };
  }

  @Get('me') @UseGuards(JwtAuthGuard) @ApiBearerAuth() @ApiOperation({ summary: 'Get current authenticated user from database' })
  me(@CurrentUser() user: any) { return this.authService.getCurrentUser(user.id); }

  @Patch('profile') @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) { return this.authService.updateProfile(user.id, dto); }

  @Patch('change-password') @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    if (user?.role === 'STUDENT') throw new ForbiddenException('Students cannot change their password. Please contact the School Admin.');
    return this.authService.changePassword(user.id, dto);
  }
}
