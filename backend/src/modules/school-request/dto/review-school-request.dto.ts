import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewSchoolRequestDto {
  @IsIn(['APPROVED', 'REJECTED'])
  action: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNotes?: string;
}
