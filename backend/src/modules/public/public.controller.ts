import {
  Controller, Get, Post, Body, Param, Req,
} from '@nestjs/common';
import { PublicService } from './public.service';
import type { Request } from 'express';

/** Public endpoints used before authentication. */
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('plans')
  getPlans() {
    return this.publicService.getPlans();
  }

  @Get('schools')
  getSchools() {
    return this.publicService.getSchools();
  }

  @Get('tenant/slug/:slug')
  resolveBySlug(@Param('slug') slug: string) {
    return this.publicService.resolveBySlug(slug);
  }

  @Get('tenant/resolve')
  resolveFromHost(@Req() req: Request) {
    const tenantSlug = (req as any).tenantSlug;
    const tenantDomain = (req as any).tenantDomain;
    if (tenantSlug) return this.publicService.resolveBySlug(tenantSlug);
    if (tenantDomain) return this.publicService.resolveByDomain(tenantDomain);
    return { message: 'No tenant resolved from host', host: req.hostname };
  }

  @Post('contact')
  submitContact(@Body() body: { name: string; email: string; message: string; schoolName?: string }) {
    return this.publicService.submitContact(body);
  }
}
