import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type TenantRequest = Request & {
  tenantSlug?: string;
  tenantDomain?: string;
};

/**
 * TenantMiddleware resolves the current school tenant from the incoming
 * request's Host header. It supports:
 *   1. Subdomain-based:  myschool.edusphere.com  → slug = "myschool"
 *   2. Custom domain:    www.myschool.com         → stored in req['tenantDomain']
 *
 * Downstream controllers / guards can read req['tenantSlug'] or req['tenantDomain']
 * to scope queries to the correct school, without performing DNS automation.
 *
 * NOTE: Full DNS routing is NOT implemented yet. This middleware only parses
 * the host header and attaches metadata for future use.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly rootDomain = process.env.ROOT_DOMAIN || 'edusphere.com';

  use(req: TenantRequest, _res: Response, next: NextFunction) {
    const host = req.hostname || req.headers.host || '';
    const hostname = host.split(':')[0].toLowerCase();

    if (hostname.endsWith(`.${this.rootDomain}`)) {
      const subdomain = hostname.replace(`.${this.rootDomain}`, '');
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        req.tenantSlug = subdomain;
      }
    } else if (
      hostname !== this.rootDomain &&
      hostname !== `www.${this.rootDomain}` &&
      hostname !== 'localhost' &&
      !hostname.endsWith('.localhost')
    ) {
      req.tenantDomain = hostname;
    }

    next();
  }
}
