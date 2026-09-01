import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveSchoolRequestDto {
  @IsIn(['APPROVED', 'REJECTED'])
  action: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNotes?: string;
}
