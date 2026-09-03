import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterSchoolDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  RefreshTokenDto,
  OnboardingPaymentDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SchoolRequestService } from '../school-request/school-request.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly schoolRequestService: SchoolRequestService,
  ) {}

  @Post('register-school')
  @ApiOperation({ summary: 'Register a new school with admin user' })
  async registerSchool(@Body() dto: RegisterSchoolDto) {
    const result = await this.authService.registerSchool(dto);

    // Keep the existing auth flow, but also create the Super Admin review record.
    await this.schoolRequestService.create({
      schoolName: dto.schoolName,
      ownerName: dto.adminName,
      email: dto.adminEmail,
      phone: dto.adminPhone,
      whatsapp: dto.adminPhone,
      city: dto.city || dto.schoolAddress,
      address: dto.schoolAddress,
      expectedStudents: dto.expectedStudents,
      subdomain: dto.schoolSlug,
      requestedPlan: dto.requestedPlan || 'FREE_TRIAL',
    });

    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);

    // A school admin may only enter the school portal after Super Admin approval.
    if (result.user.role === 'SCHOOL_ADMIN' && result.user.schoolId) {
      const request = await this.schoolRequestService.findLatestByEmail(dto.email);
      if (!request || request.status !== 'APPROVED') {
        throw new UnauthorizedException(
          request?.status === 'REJECTED'
            ? 'Your school registration was rejected. Please contact support.'
            : 'Your school is still awaiting Super Admin approval.',
        );
      }
    }

    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('onboarding-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  submitOnboardingPayment(
    @Body() dto: OnboardingPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.authService.submitOnboardingPayment(dto, user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: any) {
    return { user };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }
}
