import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { v4 as uuidv4 } from 'uuid';

const DAY_MS = 24 * 60 * 60 * 1000;
const FOREVER_DATE = new Date('9999-12-31T23:59:59.999Z');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ...existing AuthService methods remain unchanged...

  private calculateEndDate(start: Date, period: string): Date {
    const normalized = (period || '').trim().toLowerCase();

    if (normalized === 'forever') return new Date(FOREVER_DATE);

    // Backward-compatible handling for older plan rows. The canonical
    // database value is now "3 days" and is enforced by migration.
    if (
      normalized === 'trial' ||
      normalized === 'free trial' ||
      normalized === 'free_trial'
    ) {
      return new Date(start.getTime() + 3 * DAY_MS);
    }

    const monthMatch = normalized.match(/(\d+)\s*month/);
    if (monthMatch) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + Number(monthMatch[1]));
      return end;
    }

    const dayMatch = normalized.match(/(\d+)\s*day/);
    if (dayMatch) {
      return new Date(start.getTime() + Number(dayMatch[1]) * DAY_MS);
    }

    if (normalized.includes('year')) {
      const end = new Date(start);
      end.setFullYear(
        end.getFullYear() + Number(normalized.match(/\d+/)?.[0] || 1),
      );
      return end;
    }

    throw new BadRequestException('Unsupported subscription period');
  }

  // ...remaining existing AuthService methods remain unchanged...
}
