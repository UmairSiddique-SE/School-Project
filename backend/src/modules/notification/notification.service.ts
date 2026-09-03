import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, schoolId: string) {
    return this.prisma.notification.findMany({
      where: { userId, schoolId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async unreadCount(userId: string, schoolId: string) {
    return this.prisma.notification.count({ where: { userId, schoolId, isRead: false } });
  }

  async markRead(userId: string, schoolId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId, schoolId } });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string, schoolId: string) {
    await this.prisma.notification.updateMany({ where: { userId, schoolId, isRead: false }, data: { isRead: true } });
    return { success: true };
  }

  async createForUsers(userIds: string[], schoolId: string, data: { type?: string; title: string; message: string; link?: string }) {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (!uniqueUserIds.length) return [];
    await this.prisma.notification.createMany({
      data: uniqueUserIds.map(userId => ({
        userId,
        schoolId,
        type: data.type || 'INFO',
        title: data.title,
        message: data.message,
        link: data.link,
      })),
    });
    return uniqueUserIds;
  }
}
