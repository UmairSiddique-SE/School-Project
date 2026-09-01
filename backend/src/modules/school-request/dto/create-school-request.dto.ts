import { IsEmail, IsIn, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSchoolRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  schoolName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  ownerName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsNumber()
  expectedStudents?: number;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsIn(['FREE_TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'])
  requestedPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
