import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateSchoolRequestDto } from './dto/create-school-request.dto';

@Injectable()
export class SchoolRequestService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSchoolRequestDto) {
    return this.prisma.schoolRequest.create({
      data: {
        schoolName: dto.schoolName,
        ownerName: dto.ownerName,
        email: dto.email,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        city: dto.city,
        address: dto.address,
        expectedStudents: dto.expectedStudents,
        subdomain: dto.subdomain,
        requestedPlan: dto.requestedPlan || dto.plan,
        notes: dto.notes,
        status: 'PENDING',
      },
    });
  }

  async findAll() {
    return this.prisma.schoolRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.schoolRequest.findUnique({
      where: { id },
    });
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
