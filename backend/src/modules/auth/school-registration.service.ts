import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PendingSchoolRegistrationService } from './pending-school-registration.service';
import { RegisterSchoolDto } from './dto/auth.dto';

@Injectable()
export class SchoolRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pending: PendingSchoolRegistrationService,
  ) {}

  private async nextAvailableSlug(baseSlug: string) {
    const base = baseSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'school';
    const school = await this.prisma.school.findUnique({ where: { slug: base }, select: { id: true } });
    const pending = await this.prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "PendingSchoolRegistration" WHERE "schoolSlug" = ${base} LIMIT 1`;
    if (!school && pending.length === 0) return base;
    for (let i = 2; i <= 100; i += 1) {
      const candidate = `${base}-${i}`;
      const [existingSchool, existingPending] = await Promise.all([
        this.prisma.school.findUnique({ where: { slug: candidate }, select: { id: true } }),
        this.prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "PendingSchoolRegistration" WHERE "schoolSlug" = ${candidate} LIMIT 1`,
      ]);
      if (!existingSchool && existingPending.length === 0) return candidate;
    }
    return `${base}-${Date.now().toString().slice(-6)}`;
  }

  async register(dto: RegisterSchoolDto) {
    const requestedSlug = dto.schoolSlug.trim().toLowerCase();
    const email = dto.adminEmail.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) throw new ConflictException('Email already registered');

    const school = await this.prisma.school.findUnique({ where: { slug: requestedSlug }, select: { id: true } });
    const pending = await this.prisma.$queryRaw<Array<{ id: string; adminEmail: string }>>`SELECT "id", "adminEmail" FROM "PendingSchoolRegistration" WHERE "schoolSlug" = ${requestedSlug} LIMIT 1`;
    const slug = school || (pending.length > 0 && pending[0].adminEmail !== email)
      ? await this.nextAvailableSlug(requestedSlug)
      : requestedSlug;

    return this.pending.register({ ...dto, schoolSlug: slug, adminEmail: email });
  }
}
