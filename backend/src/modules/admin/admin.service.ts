import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OverviewDto } from './dto/overview.dto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';

function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d: Date, days: number): Date { return new Date(d.getTime() + days * 24 * 60 * 60 * 1000); }

const DEFAULT_PLANS = [
  { planKey: 'FREE_TRIAL', name: 'Free Trial', price: 0, currency: 'PKR', period: '3 days', maxStudents: 20, maxTeachers: 15, storageMb: 1024, supportTier: 'Email', features: JSON.stringify(['Up to 20 students', 'Up to 15 staff', '1 campus', 'Core features', 'Email support']) },
  { planKey: 'PROFESSIONAL', name: 'Professional', price: 3000, currency: 'PKR', period: 'per month', maxStudents: 500, maxTeachers: 999999, storageMb: 10240, supportTier: 'Email + Chat', features: JSON.stringify(['Up to 500 students', 'Unlimited staff', 'Full reports', 'Fee management', 'Email + Chat support']) },
  { planKey: 'PREMIUM', name: 'Premium', price: 5000, currency: 'PKR', period: 'per month', maxStudents: 999999, maxTeachers: 999999, storageMb: 512000, supportTier: 'Dedicated', features: JSON.stringify(['Unlimited students', 'Unlimited staff', 'Unlimited platform features', '500 GB storage', 'Dedicated support']) },
];

const DEFAULT_TEMPLATES = [
  { name: 'Welcome Email', subject: 'Welcome to EduSphere!', category: 'Onboarding', body: `Dear {schoolName},\n\nWelcome to EduSphere ERP! Your account has been successfully created.\n\nYour login details:\n- URL: https://{slug}.edusphere.app\n- Email: {adminEmail}\n- Temporary Password: {tempPassword}\n\nPlease change your password on first login.\n\nBest regards,\nEduSphere Team`, variables: JSON.stringify(['{schoolName}', '{slug}', '{adminEmail}', '{tempPassword}']) },
  { name: 'Plan Expiry Reminder', subject: 'Your plan expires in {days} days', category: 'Billing', body: `Dear {schoolName},\n\nThis is a reminder that your {plan} plan will expire on {expiryDate}.\n\nTo continue uninterrupted service, please renew your subscription.\n\nRenew now: https://edusphere.app/renew\n\nBest regards,\nEduSphere Team`, variables: JSON.stringify(['{schoolName}', '{plan}', '{expiryDate}', '{days}']) },
  { name: 'Payment Confirmation', subject: 'Payment received — Thank you!', category: 'Billing', body: `Dear {schoolName},\n\nWe have received your payment of {amount} for the {plan} plan.\n\nReceipt No: {receiptNo}\nValid Until: {expiryDate}\n\nThank you for choosing EduSphere!\n\nBest regards,\nEduSphere Team`, variables: JSON.stringify(['{schoolName}', '{amount}', '{plan}', '{receiptNo}', '{expiryDate}']) },
  { name: 'Account Suspended', subject: 'Your EduSphere account has been suspended', category: 'Account', body: `Dear {schoolName},\n\nYour EduSphere account has been temporarily suspended due to {reason}.\n\nTo reactivate your account, please contact support at support@edusphere.app or renew your subscription.\n\nBest regards,\nEduSphere Team`, variables: JSON.stringify(['{schoolName}', '{reason}']) },
  { name: 'Password Reset', subject: 'Reset your EduSphere password', category: 'Security', body: `Dear {name},\n\nWe received a request to reset your password.\n\nClick the link below to reset it (expires in 1 hour):\n{resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nEduSphere Team`, variables: JSON.stringify(['{name}', '{resetLink}']) },
];

const DEFAULT_SETTINGS = [
  { key: 'platform.registrations', value: 'true', type: 'toggle', label: 'Allow New Registrations', description: 'Allow new schools to register on the platform.', category: 'platform' },
  { key: 'platform.maintenance', value: 'false', type: 'toggle', label: 'Maintenance Mode', description: 'Put the platform in maintenance mode. All school dashboards will show a maintenance notice.', category: 'platform' },
  { key: 'platform.name', value: 'EduSphere ERP', type: 'text', label: 'Platform Name', description: 'The name displayed across the platform.', category: 'platform' },
  { key: 'platform.supportEmail', value: 'support@edusphere.app', type: 'text', label: 'Support Email', description: 'Email address shown to users for support.', category: 'platform' },
  { key: 'subscription.defaultPlan', value: 'FREE_TRIAL', type: 'select', label: 'Default Plan', description: 'The plan assigned to new schools upon registration.', category: 'subscription' },
  { key: 'subscription.trialDays', value: '3', type: 'number', label: 'Free Trial Duration (days)', description: 'How many days the free trial lasts before expiry.', category: 'subscription' },
  { key: 'subscription.expiryWarningDays', value: '7', type: 'number', label: 'Expiry Warning (days before)', description: 'Send warning notifications this many days before expiry.', category: 'subscription' },
  { key: 'subscription.autoSuspend', value: 'false', type: 'toggle', label: 'Auto-Suspend on Expiry', description: 'Automatically suspend school accounts when their plan expires.', category: 'subscription' },
  { key: 'email.smtpHost', value: 'smtp.gmail.com', type: 'text', label: 'SMTP Host', description: 'Your mail server hostname.', category: 'email' },
  { key: 'email.smtpPort', value: '587', type: 'number', label: 'SMTP Port', description: 'SMTP connection port.', category: 'email' },
  { key: 'email.smtpUser', value: 'noreply@edusphere.app', type: 'text', label: 'SMTP Username', description: 'Authentication username for SMTP.', category: 'email' },
  { key: 'email.fromName', value: 'EduSphere Platform', type: 'text', label: 'From Name', description: 'The name shown as the email sender.', category: 'email' },
  { key: 'notifications.emailOnRegister', value: 'true', type: 'toggle', label: 'Email on School Registration', description: 'Send a welcome email when a new school registers.', category: 'notifications' },
  { key: 'notifications.emailOnExpiry', value: 'true', type: 'toggle', label: 'Email on Plan Expiry', description: 'Send expiry reminder emails to school admins.', category: 'notifications' },
  { key: 'notifications.emailOnPayment', value: 'true', type: 'toggle', label: 'Email on Payment', description: 'Send payment confirmation emails.', category: 'notifications' },
  { key: 'notifications.adminAlerts', value: 'true', type: 'toggle', label: 'Super Admin Alerts', description: 'Receive platform alerts in the super admin dashboard.', category: 'notifications' },
  { key: 'server.maxFileSize', value: '10', type: 'number', label: 'Max File Upload (MB)', description: 'Maximum file size for uploads across all schools.', category: 'server' },
  { key: 'server.sessionTimeout', value: '60', type: 'number', label: 'Session Timeout (minutes)', description: 'Auto-logout users after this many minutes of inactivity.', category: 'server' },
  { key: 'server.twoFactor', value: 'false', type: 'toggle', label: 'Require 2FA for Super Admins', description: 'Enforce two-factor authentication for all super admins.', category: 'server' },
  { key: 'server.ipWhitelist', value: 'false', type: 'toggle', label: 'IP Whitelist Mode', description: 'Restrict super admin access to whitelisted IPs only.', category: 'server' },
];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly mailService: MailService) {}

  async seedDefaults() {
    if ((await this.prisma.platformPlan.count()) === 0) for (const plan of DEFAULT_PLANS) await this.prisma.platformPlan.create({ data: plan });
    if ((await this.prisma.platformSetting.count()) === 0) for (const s of DEFAULT_SETTINGS) await this.prisma.platformSetting.upsert({ where: { key: s.key }, create: s, update: {} });
    if ((await this.prisma.emailTemplate.count()) === 0) for (const t of DEFAULT_TEMPLATES) await this.prisma.emailTemplate.create({ data: t });
  }

  async getOverview(): Promise<OverviewDto> {
    await this.seedDefaults(); const now = new Date();
    const [totalSchools, activeSchools, trialSchools, expiredSchools] = await Promise.all([
      this.prisma.school.count({ where: { deletedAt: null } }), this.prisma.school.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.school.count({ where: { subscription: { plan: { in: ['TRIAL', 'FREE_TRIAL'] } }, deletedAt: null } }),
      this.prisma.school.count({ where: { subscription: { endDate: { lt: now } }, deletedAt: null } }),
    ]);
    const [pendingPayments, monthRevenueAgg, todayRevenueAgg] = await Promise.all([
      this.prisma.onboardingPayment.count({ where: { status: 'PENDING' } }),
      this.prisma.onboardingPayment.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', reviewedAt: { gte: startOfMonth(now) } } }),
      this.prisma.onboardingPayment.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', reviewedAt: { gte: startOfDay(now) } } }),
    ]);
    const pendingSchoolRequests = await this.prisma.schoolRequest.count({ where: { status: 'PENDING' } });
    const recentSchools = await this.prisma.school.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, createdAt: true } });
    const recentPayments = await this.prisma.onboardingPayment.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, amount: true, status: true, createdAt: true, school: { select: { name: true } } } });
    const recentActivities = await this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, action: true, entity: true, createdAt: true, user: { select: { name: true } } } });
    const expiringSchools = await this.prisma.school.findMany({ where: { subscription: { endDate: { gte: now, lte: addDays(now, 30) } }, deletedAt: null }, select: { id: true, name: true, subscription: { select: { endDate: true } } } });
    const schoolsForGrowth = await this.prisma.school.findMany({ where: { deletedAt: null }, select: { createdAt: true } });
    const growthMap: Record<string, number> = {}; schoolsForGrowth.forEach((s) => { const month = s.createdAt.toISOString().slice(0, 7); growthMap[month] = (growthMap[month] || 0) + 1; });
    const schoolGrowth = Object.entries(growthMap).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));
    const paymentsForTimeline = await this.prisma.onboardingPayment.findMany({ where: { status: 'APPROVED', reviewedAt: { not: null } }, select: { reviewedAt: true, amount: true } });
    const revenueMap: Record<string, number> = {}; paymentsForTimeline.forEach((p) => { if (p.reviewedAt) { const month = p.reviewedAt.toISOString().slice(0, 7); revenueMap[month] = (revenueMap[month] || 0) + p.amount; } });
    const revenueTimeline = Object.entries(revenueMap).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
    const subs = await this.prisma.subscription.findMany({ select: { plan: true } }); const planMap: Record<string, number> = {}; subs.forEach((s) => { planMap[s.plan] = (planMap[s.plan] || 0) + 1; });
    const planDistribution = Object.entries(planMap).map(([plan, count]) => ({ plan, count }));
    const schoolStatusList = await this.prisma.school.findMany({ where: { deletedAt: null }, select: { isActive: true } }); const statusMap: Record<string, number> = { Active: 0, Inactive: 0 }; schoolStatusList.forEach((s) => { const key = s.isActive ? 'Active' : 'Inactive'; statusMap[key] = (statusMap[key] || 0) + 1; });
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
    const [totalStudents, totalTeachers, activeSubscriptions] = await Promise.all([this.prisma.student.count({ where: { deletedAt: null } }), this.prisma.teacher.count({ where: { deletedAt: null } }), this.prisma.subscription.count({ where: { status: 'ACTIVE' } })]);
    return { totalSchools, activeSchools, trialSchools, expiredSchools, pendingSchoolRequests, pendingPayments, monthRevenue: monthRevenueAgg._sum.amount || 0, todayRevenue: todayRevenueAgg._sum.amount || 0, totalStudents, totalTeachers, activeSubscriptions, schoolGrowth, revenueTimeline, planDistribution, statusDistribution, recentSchools, recentPayments: recentPayments.map((p) => ({ id: p.id, schoolName: p.school?.name ?? '', amount: p.amount, status: p.status, createdAt: p.createdAt })), recentActivities: recentActivities.map((a) => ({ id: a.id, action: a.action, detail: `${a.action} on ${a.entity}`, time: a.createdAt, user: a.user?.name ?? 'System' })), expiringSchools: expiringSchools.map((s) => { const expiryDate = s.subscription?.endDate ?? now; return { id: s.id, name: s.name, expiryDate, daysLeft: Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / 86400000) }; }) };
  }

  async getPlans() { await this.seedDefaults(); const plans = await this.prisma.platformPlan.findMany({ orderBy: { price: 'asc' } }); return plans.map((p) => ({ ...p, features: JSON.parse(p.features || '[]') })); }
  async updatePlan(id: string, data: any) { const updateData: any = {}; if (data.price !== undefined) updateData.price = parseFloat(data.price); if (data.name !== undefined) updateData.name = data.name; if (data.maxStudents !== undefined) updateData.maxStudents = parseInt(data.maxStudents); if (data.maxTeachers !== undefined) updateData.maxTeachers = parseInt(data.maxTeachers); if (data.features !== undefined) updateData.features = JSON.stringify(data.features); return this.prisma.platformPlan.update({ where: { id }, data: updateData }); }
  async getSettings() { await this.seedDefaults(); return this.prisma.platformSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] }); }
  async updateSettings(updates: { key: string; value: string }[]) { for (const update of updates) await this.prisma.platformSetting.upsert({ where: { key: update.key }, create: { key: update.key, value: update.value }, update: { value: update.value } }); return { success: true }; }
  async updateSetting(key: string, value: string) { return this.prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } }); }
  async getEmailTemplates() { await this.seedDefaults(); return this.prisma.emailTemplate.findMany({ orderBy: { category: 'asc' } }); }
  async updateEmailTemplate(id: string, data: any) { return this.prisma.emailTemplate.update({ where: { id }, data: { subject: data.subject, body: data.body, variables: data.variables ? JSON.stringify(data.variables) : undefined } }); }
  async createSchoolRequest(data: any) { return this.prisma.schoolRequest.create({ data: { schoolName: data.schoolName, ownerName: data.ownerName, email: data.email, phone: data.phone, whatsapp: data.whatsapp, city: data.city, address: data.address, subdomain: data.subdomain, requestedPlan: data.requestedPlan || 'FREE_TRIAL', status: 'PENDING' } }); }
  async getSchoolRequests() { return this.prisma.schoolRequest.findMany({ orderBy: { createdAt: 'desc' } }); }
  async reviewSchoolRequest(id: string, data: any, actor?: any) {
    const request = await this.prisma.schoolRequest.findUnique({ where: { id } }); if (!request) throw new NotFoundException('School request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request already reviewed');
    const action = String(data.action || '').toUpperCase(); if (!['APPROVE', 'REJECT'].includes(action)) throw new BadRequestException('Action must be APPROVE or REJECT');
    if (action === 'REJECT') return this.prisma.schoolRequest.update({ where: { id }, data: { status: 'REJECTED', reviewedBy: actor?.name || 'Super Admin', reviewedAt: new Date(), reviewNotes: data.notes || 'Rejected by Super Admin.' } });
    const school = await this.prisma.school.findFirst({ where: { slug: request.subdomain }, include: { subscription: true } });
    if (!school) throw new NotFoundException('Registered school account not found');
    const planKey = request.requestedPlan || 'FREE_TRIAL';
    const plan = await this.prisma.platformPlan.findUnique({ where: { planKey } }); if (!plan) throw new NotFoundException('Requested plan not found');
    const now = new Date(); const endDate = new Date(now); const normalizedPeriod = String(plan.period || '').trim().toLowerCase(); if (normalizedPeriod.includes('month')) endDate.setMonth(endDate.getMonth() + 1); else if (normalizedPeriod.includes('year')) endDate.setFullYear(endDate.getFullYear() + 1); else { const days = Number(normalizedPeriod.match(/\d+/)?.[0] || 3); endDate.setDate(endDate.getDate() + days); }
    return this.prisma.$transaction(async (tx) => {
      await tx.school.update({ where: { id: school.id }, data: { isActive: true } });
      await tx.user.updateMany({ where: { schoolId: school.id, role: 'SCHOOL_ADMIN' }, data: { isActive: true } });
      await tx.subscription.update({ where: { schoolId: school.id }, data: { plan: plan.planKey, status: 'ACTIVE', startDate: now, endDate, amount: plan.price, currency: plan.currency } });
      return tx.schoolRequest.update({ where: { id }, data: { status: 'APPROVED', reviewedBy: actor?.name || 'Super Admin', reviewedAt: now, reviewNotes: data.notes || 'Approved by Super Admin.' } });
    });
  }

  async getSchools() { return this.prisma.school.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { subscription: true, users: { where: { role: 'SCHOOL_ADMIN' }, select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true } } }); }
  async getSchoolById(id: string) { return this.prisma.school.findUnique({ where: { id }, include: { subscription: true, users: { where: { role: 'SCHOOL_ADMIN' }, select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true } } }); }
  async updateSchool(id: string, data: any) { const school = await this.prisma.school.findUnique({ where: { id }, include: { subscription: true } }); if (!school) throw new NotFoundException('School not found'); return this.prisma.school.update({ where: { id }, data: { name: data.name, phone: data.phone, address: data.address, city: data.city, logoUrl: data.logoUrl, isActive: data.isActive } }); }
  async changePlan(id: string, planKey: string, actor?: any) { const plan = await this.prisma.platformPlan.findUnique({ where: { planKey } }); if (!plan) throw new NotFoundException('Plan not found'); return this.prisma.subscription.update({ where: { schoolId: id }, data: { plan: plan.planKey, amount: plan.price, currency: plan.currency, status: 'ACTIVE' } }); }
  async extendExpiry(id: string, days: number, actor?: any) { const sub = await this.prisma.subscription.findUnique({ where: { schoolId: id } }); if (!sub) throw new NotFoundException('Subscription not found'); if (!Number.isInteger(days) || days < 1 || days > 3660) throw new ConflictException('Extension must be between 1 and 3660 days'); if (sub.endDate >= new Date('9999-12-31T23:59:59.999Z')) return sub; const endDate = new Date(sub.endDate); endDate.setDate(endDate.getDate() + days); return this.prisma.subscription.update({ where: { schoolId: id }, data: { endDate, status: 'ACTIVE' } }); }
  async expireSchool(id: string, actor?: any) { return this.prisma.$transaction([this.prisma.subscription.update({ where: { schoolId: id }, data: { status: 'EXPIRED' } }), this.prisma.school.update({ where: { id }, data: { isActive: false } })]); }
}
