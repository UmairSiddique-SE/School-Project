import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns public-facing platform subscription plans (for landing page).
   */
  async getPlans() {
    const plans = await this.prisma.platformPlan.findMany({
      orderBy: { price: 'asc' },
    });
    return plans.map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features as string) : [],
    }));
  }

  /**
   * Resolves a school by subdomain slug (e.g., "myschool" from "myschool.edusphere.com").
   * Returns minimal public info needed to bootstrap the school's login page.
   */
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

  /**
   * Resolves a school by custom domain (e.g., "www.myschool.com").
   * Supports future custom domain mapping — domain stored in school.domain field.
   */
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

  /**
   * Submits a contact form enquiry.
   * In production this would send an email via MailService.
   * For now it validates and returns success to avoid breaking the landing page.
   */
  async submitContact(data: { name: string; email: string; message: string; schoolName?: string }) {
    // Basic validation
    if (!data.name || !data.email || !data.message) {
      return { success: false, message: 'All fields are required.' };
    }
    // TODO: wire up MailService to send the message to support@edusphere.app
    return { success: true, message: 'Your message has been received. We will get back to you within 24 hours.' };
  }
}
