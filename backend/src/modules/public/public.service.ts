import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans() {
    const plans = await this.prisma.platformPlan.findMany({
      orderBy: { price: 'asc' },
    });
    return plans.map((p) => ({
      ...p,
      features: p.features ? JSON.parse(p.features as string) : [],
    }));
  }

  /**
   * School-login discovery is intentionally DB-only.
   * Registered schools are visible here, while the frontend clearly marks
   * inactive/pending schools and prevents opening their login portal.
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
        country: true,
        logoUrl: true,
        isActive: true,
        subscription: {
          select: { plan: true, status: true, endDate: true },
        },
      },
    });

    return schools.map((school) => ({
      ...school,
      loginAvailable: school.isActive,
      status: school.isActive ? 'ACTIVE' : 'PENDING_APPROVAL',
    }));
  }

  async resolveBySlug(slug: string) {
    const school = await this.prisma.school.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        subscription: { select: { plan: true, status: true, endDate: true } },
      },
    });
    if (!school) throw new NotFoundException(`School with slug "${slug}" not found`);
    return school;
  }

  async resolveByDomain(domain: string) {
    const school = await this.prisma.school.findFirst({
      where: { domain, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        subscription: { select: { plan: true, status: true, endDate: true } },
      },
    });
    if (!school) throw new NotFoundException(`No school found for domain "${domain}"`);
    return school;
  }

  async submitContact(data: { name: string; email: string; message: string; schoolName?: string }) {
    if (!data.name || !data.email || !data.message) {
      return { success: false, message: 'All fields are required.' };
    }
    return { success: true, message: 'Your message has been received. We will get back to you within 24 hours.' };
  }
}
