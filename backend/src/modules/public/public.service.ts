import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans() {
    const plans = await this.prisma.platformPlan.findMany({
      where: { planKey: 'PROFESSIONAL', isActive: true },
      orderBy: { price: 'asc' },
    });
    return plans.map((p) => ({
      ...p,
      features: p.features ? JSON.parse(p.features as string) : [],
    }));
  }

  /**
   * School-login discovery is DB-only.
   * Registered schools remain discoverable before approval so the school
   * admin can still reach the login page. Portal access is enforced by auth
   * and route guards until Super Admin approval.
   */
  async getSchools() {
    const schools = await this.prisma.school.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        address: true,
        phone: true,
        email: true,
        country: true,
        logoUrl: true,
        website: true,
        isActive: true,
        subscription: {
          select: { plan: true, status: true, endDate: true },
        },
        _count: {
          select: {
            students: { where: { deletedAt: null } },
            teachers: { where: { deletedAt: null } },
            classes: { where: { deletedAt: null } },
          },
        },
      },
    });

    return schools.map((school) => ({
      ...school,
      studentCount: school._count?.students || 0,
      teacherCount: school._count?.teachers || 0,
      classCount: school._count?.classes || 0,
      loginAvailable: Boolean(school.slug),
      status: school.isActive ? 'ACTIVE' : 'PENDING_APPROVAL',
    }));
  }

  async resolveBySlug(slug: string) {
    const school = await this.prisma.school.findFirst({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        website: true,
        isActive: true,
        subscription: { select: { plan: true, status: true, endDate: true } },
        alerts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            actionType: true,
            actionUrl: true,
            priority: true,
            expiresAt: true,
            createdAt: true,
          },
        },
        users: {
          where: { role: 'SCHOOL_ADMIN', deletedAt: null },
          select: { name: true, email: true, phone: true },
          take: 1,
        },
        classes: {
          where: { deletedAt: null },
          select: { id: true, name: true, numeric: true },
          orderBy: { numeric: 'asc' },
          take: 12,
        },
        buildings: {
          select: { id: true, name: true, buildingType: true, hasComputerLab: true, hasScienceLab: true, hasLibrary: true, hasPlayground: true },
          take: 8,
        },
      },
    });
    if (!school) throw new NotFoundException(`School with slug "${slug}" not found`);
    const adminUser = school.users?.[0] || null;
    const offlineNotice = school.alerts?.[0] || null;
    return {
      ...school,
      adminContact: {
        name: adminUser?.name || 'School Administration',
        email: adminUser?.email || school.email || 'admin@schoolos.app',
        phone: adminUser?.phone || school.phone || '+92 300 0000000',
        address: school.address || (school.city ? `${school.city}, ${school.country || 'Pakistan'}` : 'Campus Address'),
      },
      offlineNotice,
    };
  }

  async resolveByDomain(domain: string) {
    const school = await this.prisma.school.findFirst({
      where: { domain, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        website: true,
        isActive: true,
        subscription: { select: { plan: true, status: true, endDate: true } },
        alerts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            actionType: true,
            actionUrl: true,
            priority: true,
            expiresAt: true,
            createdAt: true,
          },
        },
        users: {
          where: { role: 'SCHOOL_ADMIN', deletedAt: null },
          select: { name: true, email: true, phone: true },
          take: 1,
        },
        classes: {
          where: { deletedAt: null },
          select: { id: true, name: true, numeric: true },
          orderBy: { numeric: 'asc' },
          take: 12,
        },
        buildings: {
          select: { id: true, name: true, buildingType: true, hasComputerLab: true, hasScienceLab: true, hasLibrary: true, hasPlayground: true },
          take: 8,
        },
      },
    });
    if (!school) throw new NotFoundException(`No school found for domain "${domain}"`);
    const adminUser = school.users?.[0] || null;
    const offlineNotice = school.alerts?.[0] || null;
    return {
      ...school,
      adminContact: {
        name: adminUser?.name || 'School Administration',
        email: adminUser?.email || school.email || 'admin@schoolos.app',
        phone: adminUser?.phone || school.phone || '+92 300 0000000',
        address: school.address || (school.city ? `${school.city}, ${school.country || 'Pakistan'}` : 'Campus Address'),
      },
      offlineNotice,
    };
  }

  async submitContact(data: { name: string; email: string; message: string; schoolName?: string }) {
    if (!data.name || !data.email || !data.message) {
      return { success: false, message: 'All fields are required.' };
    }
    return { success: true, message: 'Your message has been received. We will get back to you within 24 hours.' };
  }
}
