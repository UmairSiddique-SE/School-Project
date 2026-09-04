import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom, Observable } from 'rxjs';
import { PrismaService } from '../../modules/database/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = super.canActivate(context);
    const activated = typeof result === 'boolean'
      ? result
      : result instanceof Observable
        ? await firstValueFrom(result)
        : await result;

    if (!activated) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.schoolId || user.role === 'SUPER_ADMIN') return true;

    const rawPath = String(request.originalUrl || request.url || '').split('?')[0];
    const path = rawPath.replace(/^\/api(?=\/|$)/, '') || '/';
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
        subscription: { select: { status: true, endDate: true } },
      },
    });

    if (!school || school.deletedAt) {
      throw new ForbiddenException('School account is no longer available');
    }

    const subscription = school.subscription;
    if (subscription?.status === 'PENDING' && pendingAllowedPaths.has(path)) return true;

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

    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication credentials missing or invalid');
    }
    return user;
  }
}
