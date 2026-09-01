import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

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
  // The root domain for subdomain-based resolution (configurable via ENV)
  private readonly rootDomain = process.env.ROOT_DOMAIN || 'edusphere.com';

  use(req: Request, _res: Response, next: NextFunction) {
    const host = req.hostname || req.headers.host || '';

    // Strip port if present
    const hostname = host.split(':')[0].toLowerCase();

    if (hostname.endsWith(`.${this.rootDomain}`)) {
      // Subdomain-based tenant: extract the first label
      const subdomain = hostname.replace(`.${this.rootDomain}`, '');
      // Ignore www or bare domain
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        (req as any).tenantSlug = subdomain;
      }
    } else if (
      hostname !== this.rootDomain &&
      hostname !== `www.${this.rootDomain}` &&
      hostname !== 'localhost' &&
      !hostname.endsWith('.localhost')
    ) {
      // Custom domain — pass as-is for the public controller to resolve
      (req as any).tenantDomain = hostname;
    }

    next();
  }
}
