import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGatePassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  studentId!: string;

  @IsOptional()
  @IsString()
  @IsIn(['EARLY_LEAVE', 'HALF_DAY', 'MEDICAL', 'OTHER'])
  reasonType?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
