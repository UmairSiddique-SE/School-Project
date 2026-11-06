import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OverviewDto } from './dto/overview.dto';

function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d: Date, days: number): Date { return new Date(d.getTime() + days * 86400000); }

const DEFAULT_PLANS = [
  { planKey: 'FREE_TRIAL', name: 'Free Trial', price: 0, currency: 'PKR', period: '3 days', maxStudents: 20, maxTeachers: 15, storageMb: 1024, supportTier: 'Email', features: JSON.stringify(['Up to 20 students', 'Up to 15 staff', '1 campus', 'Core features', 'Email support']) },
  { planKey: 'PROFESSIONAL', name: 'Professional', price: 3000, currency: 'PKR', period: 'per month', maxStudents: 500, maxTeachers: 999999, storageMb: 10240, supportTier: 'Email + Chat', features: JSON.stringify(['Up to 500 students', 'Unlimited staff', 'Full reports', 'Fee management', 'Email + Chat support']) },
  { planKey: 'PREMIUM', name: 'Premium', price: 5000, currency: 'PKR', period: 'per month', maxStudents: 999999, maxTeachers: 999999, storageMb: 512000, supportTier: 'Dedicated', features: JSON.stringify(['Unlimited students', 'Unlimited staff', 'Unlimited platform features', '500 GB storage', 'Dedicated support']) },
];

const DEFAULT_TEMPLATES = [
  { name: 'Welcome Email', subject: 'Welcome to EduSphere!', category: 'Onboarding', body: 'Dear {schoolName},\n\nWelcome to EduSphere ERP! Your account has been successfully created.', variables: JSON.stringify(['{schoolName}', '{slug}', '{adminEmail}', '{tempPassword}']) },
  { name: 'Plan Expiry Reminder', subject: 'Your plan expires in {days} days', category: 'Billing', body: 'Dear {schoolName},\n\nYour {plan} plan will expire on {expiryDate}.', variables: JSON.stringify(['{schoolName}', '{plan}', '{expiryDate}', '{days}']) },
  { name: 'Payment Confirmation', subject: 'Payment received — Thank you!', category: 'Billing', body: 'Dear {schoolName},\n\nWe have received your payment of {amount} for the {plan} plan.', variables: JSON.stringify(['{schoolName}', '{amount}', '{plan}', '{receiptNo}', '{expiryDate}']) },
  { name: 'Account Suspended', subject: 'Your EduSphere account has been suspended', category: 'Account', body: 'Dear {schoolName},\n\nYour EduSphere account has been suspended due to {reason}.', variables: JSON.stringify(['{schoolName}', '{reason}']) },
  { name: 'Password Reset', subject: 'Reset your EduSphere password', category: 'Security', body: 'Dear {name},\n\nUse this link to reset your password: {resetLink}', variables: JSON.stringify(['{name}', '{resetLink}']) },
];

const DEFAULT_SETTINGS = [
  { key: 'platform.registrations', value: 'true', type: 'toggle', label: 'Allow New Registrations', description: 'Allow new schools to register on the platform.', category: 'platform' },
  { key: 'platform.maintenance', value: 'false', type: 'toggle', label: 'Maintenance Mode', description: 'Put the platform in maintenance mode.', category: 'platform' },
  { key: 'platform.name', value: 'EduSphere ERP', type: 'text', label: 'Platform Name', description: 'Platform display name.', category: 'platform' },
  { key: 'platform.supportEmail', value: 'support@edusphere.app', type: 'text', label: 'Support Email', description: 'Support email address.', category: 'platform' },
  { key: 'subscription.defaultPlan', value: 'FREE_TRIAL', type: 'select', label: 'Default Plan', description: 'Default registration plan.', category: 'subscription' },
  { key: 'subscription.trialDays', value: '3', type: 'number', label: 'Free Trial Duration (days)', description: 'Free trial duration.', category: 'subscription' },
  { key: 'subscription.expiryWarningDays', value: '7', type: 'number', label: 'Expiry Warning (days before)', description: 'Expiry warning window.', category: 'subscription' },
  { key: 'subscription.autoSuspend', value: 'false', type: 'toggle', label: 'Auto-Suspend on Expiry', description: 'Suspend schools after expiry.', category: 'subscription' },
  { key: 'email.smtpHost', value: 'smtp.gmail.com', type: 'text', label: 'SMTP Host', description: 'SMTP host.', category: 'email' },
  { key: 'email.smtpPort', value: '587', type: 'number', label: 'SMTP Port', description: 'SMTP port.', category: 'email' },
  { key: 'email.smtpUser', value: 'noreply@edusphere.app', type: 'text', label: 'SMTP Username', description: 'SMTP username.', category: 'email' },
  { key: 'email.fromName', value: 'EduSphere Platform', type: 'text', label: 'From Name', description: 'Email sender name.', category: 'email' },
];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults() {
    if ((await this.prisma.platformPlan.count()) === 0) {
      for (const plan of DEFAULT_PLANS) await this.prisma.platformPlan.create({ data: plan });
    }
    if ((await this.prisma.platformSetting.count()) === 0) {
      for (const setting of DEFAULT_SETTINGS) await this.prisma.platformSetting.upsert({ where: { key: setting.key }, create: setting, update: {} });
    }
    if ((await this.prisma.emailTemplate.count()) === 0) {
      for (const template of DEFAULT_TEMPLATES) await this.prisma.emailTemplate.create({ data: template });
    }
  }

  async getOverview(): Promise<OverviewDto> {
    await this.seedDefaults();
    const now = new Date();
    const [totalSchools, activeSchools, trialSchools, expiredSchools] = await Promise.all([
      this.prisma.school.count({ where: { deletedAt: null } }),
      this.prisma.school.count({ where: { isActive: true, deletedAt: null } }),
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
    const growthMap: Record<string, number> = {};
    schoolsForGrowth.forEach((s) => { const month = s.createdAt.toISOString().slice(0, 7); growthMap[month] = (growthMap[month] || 0) + 1; });
    const schoolGrowth = Object.entries(growthMap).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));
    const paymentsForTimeline = await this.prisma.onboardingPayment.findMany({ where: { status: 'APPROVED', reviewedAt: { not: null } }, select: { reviewedAt: true, amount: true } });
    const revenueMap: Record<string, number> = {};
    paymentsForTimeline.forEach((p) => { if (p.reviewedAt) { const month = p.reviewedAt.toISOString().slice(0, 7); revenueMap[month] = (revenueMap[month] || 0) + p.amount; } });
    const revenueTimeline = Object.entries(revenueMap).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
    const subs = await this.prisma.subscription.findMany({ select: { plan: true } });
    const planMap: Record<string, number> = {};
    subs.forEach((s) => { planMap[s.plan] = (planMap[s.plan] || 0) + 1; });
    const planDistribution = Object.entries(planMap).map(([plan, count]) => ({ plan, count }));
    const schoolStatusList = await this.prisma.school.findMany({ where: { deletedAt: null }, select: { isActive: true } });
    const statusMap: Record<string, number> = { Active: 0, Inactive: 0 };
    schoolStatusList.forEach((s) => { const key = s.isActive ? 'Active' : 'Inactive'; statusMap[key] = (statusMap[key] || 0) + 1; });
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
    const [totalStudents, totalTeachers, activeSubscriptions] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);
    return {
      totalSchools, activeSchools, trialSchools, expiredSchools, pendingSchoolRequests, pendingPayments,
      monthRevenue: monthRevenueAgg._sum.amount || 0, todayRevenue: todayRevenueAgg._sum.amount || 0,
      totalStudents, totalTeachers, activeSubscriptions, schoolGrowth, revenueTimeline, planDistribution, statusDistribution,
      recentSchools,
      recentPayments: recentPayments.map((p) => ({ id: p.id, schoolName: p.school?.name ?? '', amount: p.amount, status: p.status, createdAt: p.createdAt })),
      recentActivities: recentActivities.map((a) => ({ id: a.id, action: a.action, detail: `${a.action} on ${a.entity}`, time: a.createdAt, user: a.user?.name ?? 'System' })),
      expiringSchools: expiringSchools.map((s) => { const expiryDate = s.subscription?.endDate ?? now; return { id: s.id, name: s.name, expiryDate, daysLeft: Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000) }; }),
    };
  }

  async getPlans() { await this.seedDefaults(); const plans = await this.prisma.platformPlan.findMany({ orderBy: { price: 'asc' } }); return plans.map((p) => ({ ...p, features: JSON.parse(p.features || '[]') })); }

  async updatePlan(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = String(data.name);
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.period !== undefined) updateData.period = String(data.period);
    if (data.maxStudents !== undefined) updateData.maxStudents = Number(data.maxStudents);
    if (data.maxTeachers !== undefined) updateData.maxTeachers = Number(data.maxTeachers);
    if (data.storageMb !== undefined) updateData.storageMb = Number(data.storageMb);
    if (data.supportTier !== undefined) updateData.supportTier = String(data.supportTier);
    if (data.features !== undefined) updateData.features = JSON.stringify(Array.isArray(data.features) ? data.features : String(data.features).split(',').map((v: string) => v.trim()).filter(Boolean));
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    return this.prisma.platformPlan.update({ where: { id }, data: updateData });
  }

  async getSettings() { await this.seedDefaults(); return this.prisma.platformSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] }); }
  async updateSettings(updates: { key: string; value: string }[]) { for (const update of updates) await this.updateSetting(update.key, update.value); return { success: true }; }
  async updateSetting(key: string, value: string) { return this.prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } }); }

  async getEmailTemplates() { await this.seedDefaults(); return this.prisma.emailTemplate.findMany({ orderBy: { category: 'asc' } }); }
  async createEmailTemplate(data: any) { return this.prisma.emailTemplate.create({ data: { name: data.name, subject: data.subject, category: data.category || 'General', body: data.body || '', variables: JSON.stringify(data.variables || []) } }); }
  async updateEmailTemplate(id: string, data: any) { return this.prisma.emailTemplate.update({ where: { id }, data: { name: data.name, subject: data.subject, category: data.category, body: data.body, variables: data.variables ? JSON.stringify(data.variables) : undefined } }); }
  async deleteEmailTemplate(id: string) { return this.prisma.emailTemplate.delete({ where: { id } }); }

  async createSchoolRequest(data: any) {
    return this.prisma.schoolRequest.create({ data: {
      schoolName: data.schoolName,
      ownerName: data.ownerName || data.contactName || data.name || '',
      email: data.email,
      phone: data.phone || data.mobile || '',
      city: data.city || null,
      address: data.address || null,
      subdomain: data.subdomain || data.slug,
      requestedPlan: data.requestedPlan || 'FREE_TRIAL',
      notes: data.notes || null,
      status: 'PENDING',
    } });
  }

  async getSchoolRequests(status?: string) {
    const where = status && status !== 'ALL' ? { status } : {};
    return this.prisma.schoolRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getSchools() {
    return this.prisma.school.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: true,
        users: { where: { role: 'SCHOOL_ADMIN' }, select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true } },
      },
    });
  }

  async getSchoolById(id: string) {
    return this.prisma.school.findUnique({
      where: { id },
      include: {
        subscription: true,
        users: { where: { role: 'SCHOOL_ADMIN' }, select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true } },
      },
    });
  }

  async updateSchool(id: string, data: any) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) throw new NotFoundException('School not found');
    return this.prisma.school.update({ where: { id }, data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
    } });
  }

  async changePlan(id: string, planKey: string, _actor?: any) {
    const plan = await this.prisma.platformPlan.findUnique({ where: { planKey } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.prisma.subscription.update({ where: { schoolId: id }, data: { plan: plan.planKey, amount: plan.price, currency: plan.currency, status: 'ACTIVE' } });
  }

  async extendExpiry(id: string, days: number, _actor?: any) {
    const sub = await this.prisma.subscription.findUnique({ where: { schoolId: id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (!Number.isInteger(days) || days < 1 || days > 3660) throw new ConflictException('Extension must be between 1 and 3660 days');
    const endDate = new Date(sub.endDate); endDate.setDate(endDate.getDate() + days);
    return this.prisma.subscription.update({ where: { schoolId: id }, data: { endDate, status: 'ACTIVE' } });
  }

  async expireSchool(id: string, _actor?: any) {
    return this.prisma.$transaction([
      this.prisma.subscription.update({ where: { schoolId: id }, data: { status: 'EXPIRED' } }),
      this.prisma.school.update({ where: { id }, data: { isActive: false } }),
      this.prisma.user.updateMany({ where: { schoolId: id, role: 'SCHOOL_ADMIN' }, data: { isActive: false } }),
    ]);
  }

  async getAuditLogs(action?: string, search?: string, page = 1, limit = 50) {
    const where: any = {};
    if (action && action !== 'ALL') where.action = action;
    if (search) where.OR = [{ action: { contains: search, mode: 'insensitive' } }, { entity: { contains: search, mode: 'insensitive' } }];
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true } } } }),
    ]);
    return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getReportCsv(id: string): Promise<string> {
    if (id === 'school-summary') {
      const schools = await this.prisma.school.findMany({ where: { deletedAt: null }, include: { subscription: true } });
      const rows = [['School', 'Slug', 'Status', 'Plan', 'Subscription Status', 'Expiry Date'], ...schools.map((s) => [s.name, s.slug, s.isActive ? 'Active' : 'Inactive', s.subscription?.plan || '', s.subscription?.status || '', s.subscription?.endDate?.toISOString() || ''])];
      return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    }
    throw new NotFoundException('Report type not found');
  }

  async getPlatformUsers(search?: string, role?: string) {
    const where: any = { deletedAt: null };
    if (role && role !== 'ALL') where.role = role;
    if (search?.trim()) where.OR = [{ name: { contains: search.trim(), mode: 'insensitive' } }, { email: { contains: search.trim(), mode: 'insensitive' } }];
    return this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, lastLoginAt: true, createdAt: true, school: { select: { id: true, name: true, slug: true } } } });
  }

  async getSupportTickets() {
    const tickets = await this.prisma.supportTicket.findMany({ orderBy: { createdAt: 'desc' }, include: { replies: { orderBy: { createdAt: 'asc' } } } });
    return tickets.map((ticket) => ({ ...ticket, replies: ticket.replies.map((reply) => ({ id: reply.id, sender: reply.sender, message: reply.message, time: reply.createdAt.toISOString() })) }));
  }

  async updateSupportTicket(id: string, status: string, replyMessage?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    if (replyMessage?.trim()) await this.prisma.ticketReply.create({ data: { ticketId: id, sender: 'Super Admin', message: replyMessage.trim() } });
    return this.prisma.supportTicket.update({ where: { id }, data: { status } });
  }

  async getAnnouncements() {
    return this.prisma.platformAnnouncement.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createAnnouncement(data: { title: string; message: string; target?: string; priority?: string }) {
    return this.prisma.platformAnnouncement.create({ data: { title: data.title, message: data.message, target: data.target || 'ALL', priority: data.priority || 'NORMAL', publishedAt: new Date() } });
  }
}
