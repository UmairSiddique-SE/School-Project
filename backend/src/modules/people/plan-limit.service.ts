import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PlanLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async assertStudentCapacity(schoolId: string) {
    const plan = await this.getPlan(schoolId);
    if (plan.maxStudents >= 999999) return;

    const count = await this.prisma.student.count({
      where: { schoolId, deletedAt: null },
    });
    if (count >= plan.maxStudents) {
      throw new BadRequestException(
        `Your ${plan.name} plan allows up to ${plan.maxStudents} students. Upgrade your plan to add more students.`,
      );
    }
  }

  async assertStaffCapacity(schoolId: string) {
    const plan = await this.getPlan(schoolId);
    if (plan.maxTeachers >= 999999) return;

    const [teachers, staff] = await Promise.all([
      this.prisma.teacher.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.staff.count({ where: { schoolId, deletedAt: null } }),
    ]);
    const total = teachers + staff;
    if (total >= plan.maxTeachers) {
      throw new BadRequestException(
        `Your ${plan.name} plan allows up to ${plan.maxTeachers} staff members. Upgrade your plan to add more staff.`,
      );
    }
  }

  /**
   * Buildings are the existing school infrastructure unit in this release and
   * represent the school's operational campus locations. This keeps the final
   * 1 / 2 / 5 campus entitlement enforceable without a destructive schema change.
   */
  async assertCampusCapacity(schoolId: string) {
    const plan = await this.getPlan(schoolId);
    const maxCampuses = this.getMaxCampuses(plan.planKey);
    if (maxCampuses >= 999999) return;

    const count = await this.prisma.building.count({
      where: { schoolId, isActive: true },
    });
    if (count >= maxCampuses) {
      throw new BadRequestException(
        `Your ${plan.name} plan allows up to ${maxCampuses} campus${maxCampuses === 1 ? '' : 'es'}. Upgrade your plan to add another campus.`,
      );
    }
  }

  private getMaxCampuses(planKey: string) {
    switch (planKey) {
      case 'FREE_TRIAL':
        return 1;
      case 'PROFESSIONAL':
        return 2;
      case 'PREMIUM':
        return 5;
      default:
        throw new BadRequestException('Your subscription plan has no valid campus entitlement.');
    }
  }

  private async getPlan(schoolId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { schoolId },
    });
    if (!subscription) throw new NotFoundException('School subscription not found');

    const plan = await this.prisma.platformPlan.findUnique({
      where: { planKey: subscription.plan },
    });
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Your subscription plan is unavailable. Please contact the administrator.');
    }
    return plan;
  }
}
