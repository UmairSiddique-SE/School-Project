import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSchoolRequestDto } from './dto/create-school-request.dto';

@Injectable()
export class SchoolRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSchoolRequestDto) {
    return this.prisma.schoolRequest.create({
      data: {
        schoolName: dto.schoolName.trim(),
        ownerName: dto.ownerName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone || null,
        city: dto.city || null,
        address: dto.address || null,
        subdomain: dto.subdomain?.trim().toLowerCase() || null,
        requestedPlan: dto.plan || 'FREE_TRIAL',
        notes: dto.notes || null,
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
}
