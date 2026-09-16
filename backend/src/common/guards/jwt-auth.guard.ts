import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom, Observable } from 'rxjs';
import { Request } from 'express';
import { PrismaService } from '../../modules/database/prisma.service';

type AuthenticatedUser = {
  schoolId?: string;
  role: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = super.canActivate(context);
    const activated =
      typeof result === 'boolean'
        ? result
        : result instanceof Observable
          ? await firstValueFrom(result)
          : await result;

    if (!activated) return false;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication credentials missing or invalid');
    }

    // Only the platform Super Admin is intentionally not attached to a school.
    // Every school-scoped account must carry a schoolId before reaching any
    // tenant-scoped service; otherwise Prisma can receive null and fail with
    // a 500 instead of returning a controlled authentication error.
    if (user.role === 'SUPER_ADMIN') return true;
    if (!user.schoolId) {
      throw new UnauthorizedException('School association missing for this account');
    }

    const rawPath = String(request.originalUrl || request.url || '').split('?')[0];
    const path = rawPath.replace(/^\/api(?=\/|$)/, '') || '/';
    const pendingAllowedPaths = new Set([
      '/auth/onboarding/status',
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
        subscription: { select: { id: true, status: true, endDate: true } },
      },
    });

    if (!school || school.deletedAt) {
      throw new ForbiddenException('School account is no longer available');
    }

    const subscription = school.subscription;
    if (subscription?.status === 'PENDING' && pendingAllowedPaths.has(path)) {
      return true;
    }

    if (!school.isActive) {
      throw new ForbiddenException(
        'School account is suspended or awaiting activation',
      );
    }

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'School subscription is inactive or expired',
      );
    }

    if (subscription.endDate.getTime() <= Date.now()) {
      await this.prisma.$transaction([
        this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        }),
        this.prisma.school.update({
          where: { id: user.schoolId },
          data: { isActive: false },
        }),
        this.prisma.user.updateMany({
          where: { schoolId: user.schoolId },
          data: { isActive: false },
        }),
      ]);

      throw new ForbiddenException(
        'School subscription has expired and the account is now suspended',
      );
    }

    return true;
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: AuthenticatedUser | undefined,
    info: unknown,
    _context?: ExecutionContext,
    _status?: unknown,
  ): TUser {
    void info;
    if (err || !user) {
      if (err instanceof Error) throw err;
      throw new UnauthorizedException(
        'Authentication credentials missing or invalid',
      );
    }
    return user as TUser;
  }
}
