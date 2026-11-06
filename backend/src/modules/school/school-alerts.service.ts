import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export class CreateSchoolAlertDto {
  type!: string; // 'INFO' | 'WARNING' | 'PAYMENT' | 'MAINTENANCE' | 'SUSPENSION' | 'CUSTOM'
  title!: string;
  message!: string;
  actionType?: string; // 'RENEW_PAYMENT' | 'OPEN_LINK' | 'ACKNOWLEDGE'
  actionUrl?: string;
  priority?: string; // 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
  expiresAt?: Date | string;
  createdBy?: string;
}

export const ALERT_TEMPLATES = [
  {
    id: 'payment_overdue',
    name: 'Payment Overdue / Fee Unpaid',
    type: 'PAYMENT',
    priority: 'HIGH',
    title: '⚠️ Payment Overdue Notice',
    message: 'Your school subscription payment is overdue. Please renew your plan immediately to prevent service interruption.',
    actionType: 'RENEW_PAYMENT',
    actionUrl: '/subscription',
  },
  {
    id: 'subscription_expiring',
    name: 'Subscription Expiring Soon',
    type: 'WARNING',
    priority: 'HIGH',
    title: '⏳ Subscription Expiring Soon',
    message: 'Your school subscription plan is approaching its expiration date. Please renew in advance to avoid disruption.',
    actionType: 'RENEW_PAYMENT',
    actionUrl: '/subscription',
  },
  {
    id: 'maintenance_notice',
    name: 'Scheduled Maintenance',
    type: 'MAINTENANCE',
    priority: 'NORMAL',
    title: '🛠️ Scheduled System Maintenance',
    message: 'We will be conducting scheduled system maintenance tonight from 02:00 AM to 04:00 AM PKT. Minimal downtime expected.',
    actionType: 'ACKNOWLEDGE',
  },
  {
    id: 'account_suspension',
    name: 'Account Suspension Warning',
    type: 'SUSPENSION',
    priority: 'CRITICAL',
    title: '🚨 Urgent: Account Suspension Notice',
    message: 'Your school account has pending policy or payment compliance issues and may be suspended within 24 hours.',
    actionType: 'RENEW_PAYMENT',
    actionUrl: '/subscription',
  },
  {
    id: 'policy_update',
    name: 'Platform Terms & Policy Update',
    type: 'INFO',
    priority: 'NORMAL',
    title: '📋 Platform Terms & Policy Update',
    message: 'We have updated our platform usage terms and privacy policies. Please review the updated guidelines.',
    actionType: 'ACKNOWLEDGE',
  },
  {
    id: 'custom_announcement',
    name: 'General Notice / Announcement',
    type: 'INFO',
    priority: 'NORMAL',
    title: '📢 Important Update from Super Admin',
    message: 'Please review this important announcement regarding platform enhancements and upcoming features.',
    actionType: 'ACKNOWLEDGE',
  },
];

@Injectable()
export class SchoolAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  getTemplates() {
    return ALERT_TEMPLATES;
  }

  async createAlert(schoolId: string, dto: CreateSchoolAlertDto, actor?: any) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    const alert = await (this.prisma as any).schoolAlert.create({
      data: {
        schoolId,
        type: dto.type || 'INFO',
        title: dto.title,
        message: dto.message,
        actionType: dto.actionType || null,
        actionUrl: dto.actionUrl || null,
        priority: dto.priority || 'NORMAL',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: actor?.name || actor?.email || 'Super Admin',
      },
    });

    // Log to audit log
    if (actor?.id) {
      await this.prisma.auditLog.create({
        data: {
          action: 'SCHOOL_ALERT_CREATED',
          entity: 'SchoolAlert',
          entityId: alert.id,
          schoolId,
          userId: actor.id,
          after: `Alert created: ${alert.title} [${alert.type}]`,
        },
      });
    }

    return alert;
  }

  async getAlertsForSchool(schoolId: string) {
    return (this.prisma as any).schoolAlert.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveAlertsForSchool(schoolId: string) {
    const now = new Date();
    return (this.prisma as any).schoolAlert.findMany({
      where: {
        schoolId,
        isActive: true,
        isDismissed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async dismissAlert(alertId: string, schoolId: string) {
    const alert = await (this.prisma as any).schoolAlert.findFirst({
      where: { id: alertId, schoolId },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    
    // Critical alerts cannot be dismissed by tenant
    if (alert.priority === 'CRITICAL') {
      throw new ConflictException('Critical compliance/suspension alerts cannot be dismissed. Please contact Super Admin.');
    }

    return (this.prisma as any).schoolAlert.update({
      where: { id: alertId },
      data: { isDismissed: true },
    });
  }

  async deleteAlert(alertId: string, actor?: any) {
    const alert = await (this.prisma as any).schoolAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    const deleted = await (this.prisma as any).schoolAlert.delete({
      where: { id: alertId },
    });

    if (actor?.id) {
      await this.prisma.auditLog.create({
        data: {
          action: 'SCHOOL_ALERT_DELETED',
          entity: 'SchoolAlert',
          entityId: alertId,
          schoolId: alert.schoolId,
          userId: actor.id,
          after: `Deleted alert: ${alert.title}`,
        },
      });
    }

    return deleted;
  }

  async toggleAlertActive(alertId: string, isActive: boolean, actor?: any) {
    const updated = await (this.prisma as any).schoolAlert.update({
      where: { id: alertId },
      data: { isActive },
    });

    if (actor?.id) {
      await this.prisma.auditLog.create({
        data: {
          action: 'SCHOOL_ALERT_TOGGLED',
          entity: 'SchoolAlert',
          entityId: alertId,
          schoolId: updated.schoolId,
          userId: actor.id,
          after: `Alert ${isActive ? 'activated' : 'deactivated'}: ${updated.title}`,
        },
      });
    }

    return updated;
  }
}
