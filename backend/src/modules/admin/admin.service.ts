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

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

const DEFAULT_PLANS = [
  {
    planKey: 'FREE_TRIAL', name: 'Free Trial', price: 0, currency: 'PKR', period: '14 days',
    maxStudents: 20, maxTeachers: 999999, storageMb: 1024, supportTier: 'Email',
    features: JSON.stringify(['Up to 20 students', 'Unlimited staff', '1 GB storage', 'Basic reports', 'Email support']),
  },
  {
    planKey: 'PROFESSIONAL', name: 'Professional', price: 3000, currency: 'PKR', period: 'per month',
    maxStudents: 500, maxTeachers: 999999, storageMb: 10240, supportTier: 'Email + Chat',
    features: JSON.stringify(['Up to 500 students', 'Unlimited staff', '10 GB storage', 'Full reports', 'Email + Chat support', 'Fee management']),
  },
  {
    planKey: 'PREMIUM', name: 'Premium', price: 5000, currency: 'PKR', period: 'per month',
    maxStudents: 999999, maxTeachers: 999999, storageMb: 512000, supportTier: 'Dedicated',
    features: JSON.stringify(['Unlimited students', 'Unlimited staff', '500 GB storage', 'Custom domain', 'Dedicated support', 'All Professional features', 'Transport Management', 'Multi-campus', 'API access', 'White-label']),
  },
];

const DEFAULT_TEMPLATES = [
  {
    name: 'Welcome Email', subject: 'Welcome to EduSphere!', category: 'Onboarding',
    body: `Dear {schoolName},\n\nWelcome to EduSphere ERP! Your account has been successfully created.\n\nYour login details:\n- URL: {loginUrl}\n- Email: {adminEmail}\n- Temporary Password: {tempPassword}\n\nPlease change your password on first login.\n\nBest regards,\nEduSphere Team`,
    variables: JSON.stringify(['{schoolName}', '{loginUrl}', '{adminEmail}', '{tempPassword}']),
  },
  {
    name: 'Plan Expiry Reminder', subject: 'Your plan expires in {days} days', category: 'Billing',
    body: `Dear {schoolName},\n\nThis is a reminder that your {plan} plan will expire on {expiryDate}.\n\nTo continue uninterrupted service, please renew your subscription.\n\nBest regards,\nEduSphere Team`,
    variables: JSON.stringify(['{schoolName}', '{plan}', '{expiryDate}', '{days}']),
  },
  {
    name: 'Payment Confirmation', subject: 'Payment received — Thank you!', category: 'Billing',
    body: `Dear {schoolName},\n\nWe have received your payment of {amount} for the {plan} plan.\n\nReceipt No: {receiptNo}\nValid Until: {expiryDate}\n\nThank you for choosing EduSphere!\n\nBest regards,\nEduSphere Team`,
    variables: JSON.stringify(['{schoolName}', '{amount}', '{plan}', '{receiptNo}', '{expiryDate}']),
  },
  {
    name: 'Account Suspended', subject: 'Your EduSphere account has been suspended', category: 'Account',
    body: `Dear {schoolName},\n\nYour EduSphere account has been temporarily suspended due to {reason}.\n\nPlease contact support to reactivate your account.\n\nBest regards,\nEduSphere Team`,
    variables: JSON.stringify(['{schoolName}', '{reason}']),
  },
  {
    name: 'Password Reset', subject: 'Reset your EduSphere password', category: 'Security',
    body: `Dear {name},\n\nWe received a request to reset your password.\n\nReset link: {resetLink}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nEduSphere Team`,
    variables: JSON.stringify(['{name}', '{resetLink}']),
  },
];

const DEFAULT_SETTINGS = [
  { key: 'platform.registrations', value: 'true', type: 'toggle', label: 'Allow New Registrations', description: 'Allow new schools to register on the platform.', category: 'platform' },
  { key: 'platform.maintenance', value: 'false', type: 'toggle', label: 'Maintenance Mode', description: 'Put the platform in maintenance mode.', category: 'platform' },
  { key: 'platform.name', value: 'EduSphere ERP', type: 'text', label: 'Platform Name', description: 'The name displayed across the platform.', category: 'platform' },
  { key: 'platform.supportEmail', value: 'support@edusphere.app', type: 'text', label: 'Support Email', description: 'Email address shown to users for support.', category: 'platform' },
  { key: 'subscription.defaultPlan', value: 'FREE_TRIAL', type: 'select', label: 'Default Plan', description: 'Default plan for new schools.', category: 'subscription' },
  { key: 'subscription.trialDays', value: '14', type: 'number', label: 'Free Trial Duration (days)', description: 'Free trial duration.', category: 'subscription' },
  { key: 'subscription.expiryWarningDays', value: '7', type: 'number', label: 'Expiry Warning (days before)', description: 'Expiry warning threshold.', category: 'subscription' },
  { key: 'subscription.autoSuspend', value: 'false', type: 'toggle', label: 'Auto-Suspend on Expiry', description: 'Automatically suspend expired schools.', category: 'subscription' },
  { key: 'notifications.emailOnRegister', value: 'true', type: 'toggle', label: 'Email on School Registration', description: 'Send registration emails.', category: 'notifications' },
  { key: 'notifications.emailOnExpiry', value: 'true', type: 'toggle', label: 'Email on Plan Expiry', description: 'Send expiry reminders.', category: 'notifications' },
  { key: 'notifications.emailOnPayment', value: 'true', type: 'toggle', label: 'Email on Payment', description: 'Send payment confirmation.', category: 'notifications' },
  { key: 'notifications.adminAlerts', value: 'true', type: 'toggle', label: 'Super Admin Alerts', description: 'Receive platform alerts.', category: 'notifications' },
];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly mailService: MailService) {}

  async seedDefaults() {
    const planCount = await this.prisma.platformPlan.count();
    if (planCount === 0) for (const plan of DEFAULT_PLANS) await this.prisma.platformPlan.create({ data: plan });
    const settingCount = await this.prisma.platformSetting.count();
    if (settingCount === 0) for (const s of DEFAULT_SETTINGS) await this.prisma.platformSetting.upsert({ where: { key: s.key }, create: s, update: {} });
    const templateCount = await this.prisma.emailTemplate.count();
    if (templateCount === 0) for (const t of DEFAULT_TEMPLATES) await this.prisma.emailTemplate.create({ data: t });
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
    const growthMap: Record<string, number> = {}; schoolsForGrowth.forEach(s => { const month = s.createdAt.toISOString().slice(0, 7); growthMap[month] = (growthMap[month] || 0) + 1; });
    const schoolGrowth = Object.entries(growthMap).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));
    const paymentsForTimeline = await this.prisma.onboardingPayment.findMany({ where: { status: 'APPROVED', reviewedAt: { not: null } }, select: { reviewedAt: true, amount: true } });
    const revenueMap: Record<string, number> = {}; paymentsForTimeline.forEach(p => { if (p.reviewedAt) { const month = p.reviewedAt.toISOString().slice(0, 7); revenueMap[month] = (revenueMap[month] || 0) + p.amount; } });
    const revenueTimeline = Object.entries(revenueMap).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
    const subs = await this.prisma.subscription.findMany({ select: { plan: true } }); const planMap: Record<string, number> = {}; subs.forEach(s => { planMap[s.plan] = (planMap[s.plan] || 0) + 1; });
    const planDistribution = Object.entries(planMap).map(([plan, count]) => ({ plan, count }));
    const schoolStatusList = await this.prisma.school.findMany({ where: { deletedAt: null }, select: { isActive: true } });
    const statusMap: Record<string, number> = { Active: 0, Inactive: 0 }; schoolStatusList.forEach(s => { const key = s.isActive ? 'Active' : 'Inactive'; statusMap[key] = (statusMap[key] || 0) + 1; });
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
    const [totalStudents, totalTeachers, activeSubscriptions] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }), this.prisma.teacher.count({ where: { deletedAt: null } }), this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);
    return { totalSchools, activeSchools, trialSchools, expiredSchools, pendingSchoolRequests, pendingPayments, monthRevenue: monthRevenueAgg._sum.amount || 0, todayRevenue: todayRevenueAgg._sum.amount || 0, totalStudents, totalTeachers, activeSubscriptions, schoolGrowth, revenueTimeline, planDistribution, statusDistribution, recentSchools, recentPayments: recentPayments.map(p => ({ id: p.id, schoolName: p.school?.name ?? '', amount: p.amount, status: p.status, createdAt: p.createdAt })), recentActivities: recentActivities.map(a => ({ id: a.id, action: a.action, detail: `${a.action} on ${a.entity}`, time: a.createdAt, user: a.user?.name ?? 'System' })), expiringSchools: expiringSchools.map(s => { const expiryDate = s.subscription?.endDate ?? now; return { id: s.id, name: s.name, expiryDate, daysLeft: Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000) }; }) };
  }

  async getPlans() { await this.seedDefaults(); const plans = await this.prisma.platformPlan.findMany({ orderBy: { price: 'asc' } }); return plans.map(p => ({ ...p, features: JSON.parse(p.features || '[]') })); }
  async updatePlan(id: string, data: any) {
    const updateData: any = {};
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.name !== undefined) updateData.name = String(data.name).trim();
    if (data.maxStudents !== undefined) updateData.maxStudents = Number(data.maxStudents);
    if (data.maxTeachers !== undefined) updateData.maxTeachers = Number(data.maxTeachers);
    if (data.features !== undefined) updateData.features = JSON.stringify(data.features);
    return this.prisma.platformPlan.update({ where: { id }, data: updateData });
  }

  async getSettings() { await this.seedDefaults(); return this.prisma.platformSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] }); }
  async updateSettings(updates: { key: string; value: string }[]) { for (const update of updates) await this.prisma.platformSetting.upsert({ where: { key: update.key }, create: { key: update.key, value: update.value }, update: { value: update.value } }); return { success: true }; }
  async updateSetting(key: string, value: string) { return this.prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } }); }
  async getEmailTemplates() { await this.seedDefaults(); return this.prisma.emailTemplate.findMany({ orderBy: { category: 'asc' } }); }
  async createEmailTemplate(data: any) { return this.prisma.emailTemplate.create({ data: { name: data.name, subject: data.subject, body: data.body, category: data.category || 'General', variables: data.variables ? JSON.stringify(data.variables) : null } }); }
  async updateEmailTemplate(id: string, data: any) { return this.prisma.emailTemplate.update({ where: { id }, data: { name: data.name, subject: data.subject, body: data.body, category: data.category, variables: data.variables ? JSON.stringify(data.variables) : undefined } }); }
  async deleteEmailTemplate(id: string) { return this.prisma.emailTemplate.delete({ where: { id } }); }

  async getSchoolRequests(status?: string) { const where = status && status !== 'ALL' ? { status } : {}; return this.prisma.schoolRequest.findMany({ where, orderBy: { createdAt: 'desc' } }); }
  async createSchoolRequest(data: any) { return this.prisma.schoolRequest.create({ data: { schoolName: String(data.schoolName).trim(), ownerName: String(data.ownerName).trim(), email: String(data.email).trim().toLowerCase(), phone: data.phone || null, whatsapp: data.whatsapp || null, city: data.city || null, address: data.address || null, expectedStudents: data.expectedStudents === undefined ? null : Number(data.expectedStudents), subdomain: data.subdomain || null, requestedPlan: data.requestedPlan || data.plan || 'FREE_TRIAL', notes: data.notes || null, status: 'PENDING' } }); }

  async reviewSchoolRequest(id: string, action: 'APPROVED' | 'REJECTED', reviewNotes?: string, reviewedBy?: string, reviewerUserId?: string) {
    const request = await this.prisma.schoolRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('School request not found');
    if (request.status !== 'PENDING') throw new ConflictException('This request has already been reviewed');
    if (action === 'REJECTED') return this.prisma.$transaction(async tx => {
      const updated = await tx.schoolRequest.update({ where: { id }, data: { status: 'REJECTED', reviewNotes: reviewNotes || null, reviewedBy: reviewedBy || 'Super Admin', reviewedAt: new Date() } });
      if (reviewerUserId) await tx.auditLog.create({ data: { action: 'SCHOOL_REQUEST_REJECTED', entity: 'SchoolRequest', entityId: id, userId: reviewerUserId, after: `Rejected registration request for ${request.schoolName}` } });
      return updated;
    });

    // Registration creates the school in a disabled state. Approval only activates it.
    const school = await this.prisma.school.findFirst({ where: { email: request.email, deletedAt: null }, include: { subscription: true, users: { where: { role: 'SCHOOL_ADMIN' }, take: 1 } } });
    if (!school) throw new ConflictException('Registered school account not found. Ask the applicant to complete registration first.');
    if (school.isActive) throw new ConflictException('This school is already active');
    if (!school.subscription) throw new ConflictException('School subscription record is missing');
    const adminUser = school.users[0];
    if (!adminUser) throw new ConflictException('School admin account is missing');

    const result = await this.prisma.$transaction(async tx => {
      const updatedRequest = await tx.schoolRequest.update({ where: { id }, data: { status: 'APPROVED', reviewNotes: reviewNotes || null, reviewedBy: reviewedBy || 'Super Admin', reviewedAt: new Date() } });
      await tx.school.update({ where: { id: school.id }, data: { isActive: true } });
      await tx.subscription.update({ where: { schoolId: school.id }, data: { status: 'ACTIVE' } });
      if (reviewerUserId) await tx.auditLog.create({ data: { action: 'SCHOOL_REQUEST_APPROVED', entity: 'SchoolRequest', entityId: id, schoolId: school.id, userId: reviewerUserId, after: `Approved ${request.schoolName}` } });
      const userIds = (await tx.user.findMany({ where: { schoolId: school.id, isActive: true }, select: { id: true } })).map(u => u.id);
      if (userIds.length) await tx.notification.createMany({ data: userIds.map(userId => ({ type: 'SYSTEM', title: 'School approved', message: 'Your school account has been approved. You can now sign in.', schoolId: school.id, userId })) });
      return updatedRequest;
    });
    return result;
  }

  async getAuditLogs(action?: string, search?: string, page?: number, limit?: number) {
    const where: any = {}; if (action && action !== 'ALL') where.action = action; if (search) where.OR = [{ entity: { contains: search } }, { action: { contains: search } }, { user: { name: { contains: search } } }];
    if (page !== undefined && limit !== undefined) { const skip = Math.max(0, (page - 1) * limit); const [total, data] = await Promise.all([this.prisma.auditLog.count({ where }), this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { user: { select: { name: true, email: true, role: true } }, school: { select: { name: true } } } })]); return { data: data.map(log => ({ id: log.id, action: log.action, entity: log.entity, entityId: log.entityId, entityName: log.school?.name || log.entity, actor: log.user?.name || 'System', actorEmail: log.user?.email || '', details: log.after || log.action, ip: log.ipAddress || 'N/A', timestamp: log.createdAt })), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }; }
    const logs = await this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { user: { select: { name: true, email: true, role: true } }, school: { select: { name: true } } } });
    return logs.map(log => ({ id: log.id, action: log.action, entity: log.entity, entityId: log.entityId, entityName: log.school?.name || log.entity, actor: log.user?.name || 'System', actorEmail: log.user?.email || '', details: log.after || log.action, ip: log.ipAddress || 'N/A', timestamp: log.createdAt }));
  }

  async getPayments() { return this.prisma.onboardingPayment.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { school: { select: { name: true, slug: true } } } }); }
  async approvePayment(id: string, actor?: any) {
    const payment = await this.prisma.onboardingPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PENDING') throw new BadRequestException('Only pending payments can be approved');
    return this.prisma.$transaction(async tx => {
      const approved = await tx.onboardingPayment.update({ where: { id }, data: { status: 'APPROVED', reviewedAt: new Date() } });
      await tx.school.update({ where: { id: payment.schoolId }, data: { isActive: true } });
      const plan = await tx.platformPlan.findUnique({ where: { planKey: payment.plan } });
      await tx.subscription.update({ where: { schoolId: payment.schoolId }, data: { plan: payment.plan, status: 'ACTIVE', startDate: new Date(), endDate: addDays(new Date(), 30), amount: payment.amount, currency: plan?.currency || 'PKR' } });
      if (actor?.id) await tx.auditLog.create({ data: { action: 'PAYMENT_APPROVED', entity: 'OnboardingPayment', entityId: id, after: `Approved PKR ${payment.amount} for ${payment.plan}`, schoolId: payment.schoolId, userId: actor.id } });
      const users = await tx.user.findMany({ where: { schoolId: payment.schoolId, isActive: true }, select: { id: true } });
      if (users.length) await tx.notification.createMany({ data: users.map(u => ({ type: 'PAYMENT', title: 'Payment approved', message: `Your ${payment.plan} subscription payment has been approved.`, schoolId: payment.schoolId, userId: u.id })) });
      return approved;
    });
  }
  async rejectPayment(id: string, actor?: any) {
    const payment = await this.prisma.onboardingPayment.findUnique({ where: { id } }); if (!payment) throw new NotFoundException('Payment not found'); if (payment.status !== 'PENDING') throw new BadRequestException('Only pending payments can be rejected');
    return this.prisma.$transaction(async tx => { const rejected = await tx.onboardingPayment.update({ where: { id }, data: { status: 'REJECTED', reviewedAt: new Date() } }); if (actor?.id) await tx.auditLog.create({ data: { action: 'PAYMENT_REJECTED', entity: 'OnboardingPayment', entityId: id, after: `Rejected PKR ${payment.amount} for ${payment.plan}`, schoolId: payment.schoolId, userId: actor.id } }); return rejected; });
  }

  async getReportCsv(id: string): Promise<string> {
    if (id === 'school-summary') { const schools = await this.prisma.school.findMany({ where: { deletedAt: null }, include: { subscription: true } }); let csv = 'ID,Name,Slug,Email,Phone,City,Plan,Status,ExpiryDate\n'; for (const s of schools) csv += `"${s.id}","${s.name}","${s.slug}","${s.email || ''}","${s.phone || ''}","${s.city || ''}","${s.subscription?.plan || 'N/A'}","${s.isActive ? 'Active' : 'Suspended'}","${s.subscription?.endDate ? s.subscription.endDate.toISOString() : ''}"\n`; return csv; }
    if (id === 'revenue-report') { const payments = await this.prisma.onboardingPayment.findMany({ include: { school: true } }); let csv = 'PaymentID,SchoolName,Amount,Method,Status,Date\n'; for (const p of payments) csv += `"${p.id}","${p.school?.name || 'N/A'}",${p.amount},"${p.method}","${p.status}","${p.createdAt.toISOString()}"\n`; return csv; }
    if (id === 'user-report') { const users = await this.prisma.user.findMany({ where: { deletedAt: null }, include: { school: true } }); let csv = 'UserID,Name,Email,Role,School,Status,CreatedAt\n'; for (const u of users) csv += `"${u.id}","${u.name}","${u.email}","${u.role}","${u.school?.name || 'Platform'}","${u.isActive ? 'Active' : 'Suspended'}","${u.createdAt.toISOString()}"\n`; return csv; }
    if (id === 'plan-report') { const subs = await this.prisma.subscription.findMany({ include: { school: true } }); let csv = 'SchoolID,SchoolName,Plan,Status,EndDate\n'; for (const s of subs) csv += `"${s.schoolId}","${s.school?.name}","${s.plan}","${s.status}","${s.endDate.toISOString()}"\n`; return csv; }
    if (id === 'expiry-report') { const now = new Date(); const thirtyDays = addDays(now, 30); const schools = await this.prisma.school.findMany({ where: { deletedAt: null, subscription: { endDate: { gte: now, lte: thirtyDays } } }, include: { subscription: true } }); let csv = 'SchoolID,SchoolName,Plan,ExpiryDate,Email\n'; for (const s of schools) csv += `"${s.id}","${s.name}","${s.subscription?.plan}","${s.subscription?.endDate.toISOString()}","${s.email || ''}"\n`; return csv; }
    if (id === 'audit-report') { const logs = await this.prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 1000 }); let csv = 'LogID,Action,Entity,EntityID,Actor,ActorEmail,Timestamp\n'; for (const l of logs) csv += `"${l.id}","${l.action}","${l.entity}","${l.entityId || ''}","${l.user?.name || 'System'}","${l.user?.email || ''}","${l.createdAt.toISOString()}"\n`; return csv; }
    throw new NotFoundException('Report type not found');
  }

  async getPlatformUsers(search?: string, role?: string) { const where: any = { deletedAt: null }; if (role && role !== 'ALL') where.role = role; if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { school: { name: { contains: search } } }]; return this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, lastLoginAt: true, createdAt: true, school: { select: { id: true, name: true, slug: true } } } }); }
  async toggleUserActive(id: string) { const user = await this.prisma.user.findUnique({ where: { id } }); if (!user) throw new NotFoundException('User not found'); if (user.role === 'SUPER_ADMIN') throw new BadRequestException('Super Admin accounts cannot be suspended here'); return this.prisma.user.update({ where: { id }, data: { isActive: !user.isActive } }); }
  async getSupportTickets() { const tickets = await this.prisma.supportTicket.findMany({ orderBy: { createdAt: 'desc' }, include: { replies: { orderBy: { createdAt: 'asc' } } } }); return tickets.map(ticket => ({ ...ticket, replies: ticket.replies.map(reply => ({ sender: reply.sender, message: reply.message, time: reply.createdAt.toISOString() })) })); }
  async updateSupportTicket(id: string, status: string, replyMessage?: string) {
    const allowed = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']; if (!allowed.includes(status)) throw new BadRequestException('Invalid ticket status');
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } }); if (!ticket) throw new NotFoundException('Ticket not found');
    await this.prisma.$transaction(async tx => { await tx.supportTicket.update({ where: { id }, data: { status } }); if (replyMessage?.trim()) await tx.ticketReply.create({ data: { ticketId: id, sender: 'Super Admin', message: replyMessage.trim() } }); });
    return this.prisma.supportTicket.findUnique({ where: { id }, include: { replies: { orderBy: { createdAt: 'asc' } } } });
  }
  async getAnnouncements() { return this.prisma.platformAnnouncement.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createAnnouncement(data: { title: string; message: string; target?: string; priority?: string }) {
    const title = data.title?.trim(); const message = data.message?.trim(); if (!title || !message) throw new BadRequestException('Title and message are required');
    const target = data.target || 'ALL'; if (!['ALL', 'PAID'].includes(target)) throw new BadRequestException('Invalid announcement target');
    return this.prisma.$transaction(async tx => {
      const announcement = await tx.platformAnnouncement.create({ data: { title, message, target, priority: data.priority || 'NORMAL' } });
      const schools = await tx.school.findMany({ where: { isActive: true, ...(target === 'PAID' ? { subscription: { plan: { not: 'FREE_TRIAL' } } } : {}) }, select: { id: true, users: { where: { isActive: true }, select: { id: true } } } });
      const notifications = schools.flatMap(school => school.users.map(user => ({ type: 'ANNOUNCEMENT', title, message, schoolId: school.id, userId: user.id })));
      if (notifications.length) await tx.notification.createMany({ data: notifications });
      return announcement;
    });
  }
}
