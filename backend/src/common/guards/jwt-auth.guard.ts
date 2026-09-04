import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../modules/database/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);
    return Promise.resolve(result).then(async (activated) => {
      if (!activated) return activated;

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Super admins are platform-level users and are not tied to a school subscription.
      if (!user?.schoolId || user.role === 'SUPER_ADMIN') return activated;

      // Keep the payment submission and basic account recovery/profile endpoints available
      // while a school is waiting for payment approval.
      const path = String(request.originalUrl || request.url || '').split('?')[0];
      const pendingAllowedPaths = new Set([
        '/auth/onboarding-payment',
        '/auth/me',
        '/auth/profile',
        '/auth/change-password',
      ]);

      const school = await this.prisma.school.findUnique({
        where: { id: user.schoolId },
        select: {
          isActive: true,
          deletedAt: true,
          subscription: {
            select: { status: true, endDate: true },
          },
        },
      });

      if (!school || school.deletedAt) {
        throw new ForbiddenException('School account is no longer available');
      }

      const subscription = school.subscription;
      const pendingApproval =
        subscription?.status === 'PENDING' && pendingAllowedPaths.has(path);

      if (pendingApproval) return activated;

      if (!school.isActive) {
        throw new ForbiddenException('School account is suspended or awaiting activation');
      }

      if (
        !subscription ||
        subscription.status !== 'ACTIVE' ||
        subscription.endDate.getTime() < Date.now()
      ) {
        throw new ForbiddenException('School subscription is inactive or expired');
      }

      return activated;
    });
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication credentials missing or invalid');
    }
    return user;
  }
}
