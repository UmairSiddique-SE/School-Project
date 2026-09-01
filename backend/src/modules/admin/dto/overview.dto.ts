// backend/src/modules/admin/dto/overview.dto.ts
import { IsNumber, IsArray, IsString, IsObject } from 'class-validator';

export class OverviewDto {
  @IsNumber()
  totalSchools: number;

  @IsNumber()
  activeSchools: number;

  @IsNumber()
  trialSchools: number;

  @IsNumber()
  expiredSchools: number;

  @IsNumber()
  pendingSchoolRequests: number;

  @IsNumber()
  pendingPayments: number;

  @IsNumber()
  monthRevenue: number;

  @IsNumber()
  todayRevenue: number;

  @IsNumber()
  totalStudents: number;

  @IsNumber()
  totalTeachers: number;

  @IsNumber()
  activeSubscriptions: number;

  @IsArray()
  schoolGrowth: { month: string; count: number }[];

  @IsArray()
  revenueTimeline: { month: string; amount: number }[];

  @IsArray()
  planDistribution: { plan: string; count: number }[];

  @IsArray()
  statusDistribution: { status: string; count: number }[];

  @IsArray()
  recentSchools: { id: string; name: string; createdAt: Date }[];

  @IsArray()
  recentPayments: { id: string; schoolName: string; amount: number; status: string; createdAt: Date }[];

  @IsArray()
  recentActivities: { id: string; action: string; detail: string; time: Date; user: string }[];

  @IsArray()
  expiringSchools: { id: string; name: string; expiryDate: Date; daysLeft: number }[];
}
