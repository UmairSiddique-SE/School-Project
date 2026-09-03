import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSchoolRequestDto } from './dto/create-school-request.dto';

@Injectable()
export class SchoolRequestService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSchoolRequestDto) {
    const email = dto.email.trim().toLowerCase();
    const requestedPlan = dto.requestedPlan || dto.plan || 'FREE_TRIAL';

    // Idempotency: registration and UI confirmation can safely call this endpoint
    // more than once without creating duplicate approval cards.
    const existing = await this.prisma.schoolRequest.findFirst({
      where: {
        email,
        schoolName: dto.schoolName.trim(),
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    const request = await this.prisma.schoolRequest.create({
      data: {
        schoolName: dto.schoolName.trim(),
        ownerName: dto.ownerName.trim(),
        email,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        city: dto.city,
        address: dto.address,
        expectedStudents: dto.expectedStudents,
        subdomain: dto.subdomain,
        requestedPlan,
        notes: dto.notes,
        status: 'PENDING',
      },
    });

    // Link the approval request to the already-created school/admin pair.
    const owner = await this.prisma.user.findUnique({
      where: { email },
      select: { schoolId: true },
    });
    if (owner?.schoolId) {
      await this.prisma.school.update({
        where: { id: owner.schoolId },
        data: { email },
      });
    }

    return request;
  }

  async findAll() {
    return this.prisma.schoolRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.schoolRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('School request not found');
    return request;
  }

  async findLatestByEmail(email: string) {
    return this.prisma.schoolRequest.findFirst({
      where: { email: email.trim().toLowerCase() },
      orderBy: { createdAt: 'desc' },
    });
  }
}
