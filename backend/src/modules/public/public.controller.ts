import {
  Controller, Get, Post, Body, Param, Req,
} from '@nestjs/common';
import { PublicService } from './public.service';
import type { Request } from 'express';

/**
 * PublicController — No authentication required.
 * Used for landing page data and multi-tenant school resolution.
 */
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /**
   * GET /public/plans
   * Returns available subscription plans for the landing page.
   */
  @Get('plans')
  getPlans() {
    return this.publicService.getPlans();
  }

  /**
   * GET /public/tenant/slug/:slug
   * Resolves school info by subdomain slug.
   * Used when accessing e.g., myschool.edusphere.com to identify the tenant.
   */
  @Get('tenant/slug/:slug')
  resolveBySlug(@Param('slug') slug: string) {
    return this.publicService.resolveBySlug(slug);
  }

  /**
   * GET /public/tenant/resolve
   * Auto-resolves the current request's host header (subdomain or custom domain).
   * Useful for schools using custom domains.
   */
  @Get('tenant/resolve')
  resolveFromHost(@Req() req: Request) {
    const tenantSlug = (req as any).tenantSlug;
    const tenantDomain = (req as any).tenantDomain;

    if (tenantSlug) {
      return this.publicService.resolveBySlug(tenantSlug);
    }
    if (tenantDomain) {
      return this.publicService.resolveByDomain(tenantDomain);
    }
    return { message: 'No tenant resolved from host', host: req.hostname };
  }

  /**
   * POST /public/contact
   * Handles contact form submissions from the landing page.
   */
  @Post('contact')
  submitContact(@Body() body: { name: string; email: string; message: string; schoolName?: string }) {
    return this.publicService.submitContact(body);
  }
}
