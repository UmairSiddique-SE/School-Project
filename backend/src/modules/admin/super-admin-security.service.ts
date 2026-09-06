import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SuperAdminSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleUserActive(targetUserId: string, actorUserId: string) {
    if (targetUserId === actorUserId) {
      throw new BadRequestException('Super Admin cannot disable the account currently in use.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, role: true, isActive: true, deletedAt: true },
    });

    if (!target || target.deletedAt) throw new NotFoundException('User not found');

    if (target.role === 'SUPER_ADMIN' && target.isActive) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null },
      });

      if (activeSuperAdmins <= 1) {
        throw new BadRequestException('The last active Super Admin account cannot be disabled.');
      }
    }

    const nextActive = !target.isActive;
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: targetUserId },
        data: { isActive: nextActive },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });

      await tx.auditLog.create({
        data: {
          action: nextActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entity: 'User',
          entityId: targetUserId,
          userId: actorUserId,
          after: `${nextActive ? 'Activated' : 'Deactivated'} user ${target.email ?? target.name}`,
        },
      });

      return result;
    });

    return updated;
  }
}
