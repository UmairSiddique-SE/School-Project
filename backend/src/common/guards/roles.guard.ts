import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

type RoleRequest = Request & {
  user?: {
    role?: string;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RoleRequest>();
    const userRole = (request.user?.role || '').trim().toUpperCase();

    if (!userRole) {
      return false;
    }

    const normalizedRequired = requiredRoles.map((r) => r.trim().toUpperCase());

    // Allow ADMIN where SCHOOL_ADMIN is required
    if (normalizedRequired.includes('SCHOOL_ADMIN') && (userRole === 'SCHOOL_ADMIN' || userRole === 'ADMIN')) {
      return true;
    }

    return normalizedRequired.includes(userRole);
  }
}

