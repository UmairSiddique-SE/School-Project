import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload { sub: string; email: string; role: string; schoolId?: string; }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is required');
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: secret });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true, schoolId: true, school: { select: { name: true, slug: true, isActive: true, subscription: { select: { plan: true, status: true } } } } },
    });
    if (!user || !user.isActive || (user.school && !user.school.isActive)) throw new UnauthorizedException('User not found or inactive');
    return { ...user, activationStatus: 'ACTIVE', plan: user.school?.subscription?.plan };
  }
}
