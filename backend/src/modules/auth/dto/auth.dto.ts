import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsUrl,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterSchoolDto {
  @IsString() @IsNotEmpty() @MaxLength(120) schoolName: string;
  @IsString() @IsNotEmpty() @MaxLength(80) schoolSlug: string;
  @IsString() @IsIn(['SCHOOL', 'COLLEGE', 'ACADEMY']) schoolType: string;
  @IsString() @IsNotEmpty() @IsUrl({ require_protocol: true }) logoUrl: string;
  @IsString() @IsNotEmpty() @MaxLength(200) schoolAddress: string;
  @IsString() @IsNotEmpty() @MaxLength(40) schoolPhone: string;
  @IsString() @IsNotEmpty() @MaxLength(80) country: string;
  @IsString() @IsNotEmpty() @MaxLength(80) city: string;
  @IsString() @IsNotEmpty() @MaxLength(120) adminName: string;
  @IsEmail() adminEmail: string;
  @IsString() @IsNotEmpty() @MaxLength(40) adminPhone: string;
  @IsString() @MinLength(12, { message: 'Password must be at least 12 characters' }) @MaxLength(128) adminPassword: string;
  @IsOptional() @IsString() @IsIn(['FREE_TRIAL', 'PROFESSIONAL', 'PREMIUM']) requestedPlan?: string;
}

export class ForgotPasswordDto {
  @IsEmail() email: string;
}

export class ResetPasswordDto {
  @IsString() @IsNotEmpty() token: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword: string;
}

export class VerifyEmailDto {
  @IsString() @IsNotEmpty() userId: string;
  @IsString() @IsNotEmpty() @MaxLength(6) otp: string;
}

export class OnboardingPaymentDto {
  @IsString() @IsNotEmpty() schoolId: string;
  @IsString() @IsNotEmpty() @IsIn(['FREE_TRIAL', 'PROFESSIONAL', 'PREMIUM']) plan: string;
  @IsString() @IsNotEmpty() @MaxLength(40) method: string;
  @IsOptional() @IsInt() @Min(0) amount?: number;
  @IsOptional() @IsString() @MaxLength(2800000) screenshotUrl?: string;
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
}

export class RefreshTokenDto {
  @IsString() @IsNotEmpty() refreshToken: string;
}

export class UpdateProfileDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
}

export class ChangePasswordDto {
  @IsString() @MinLength(8) @MaxLength(128) currentPassword: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword: string;
}
