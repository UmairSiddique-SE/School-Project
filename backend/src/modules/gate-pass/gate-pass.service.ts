import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateGatePassDto } from './dto/create-gate-pass.dto';

const REASON_TYPES = ['EARLY_LEAVE', 'HALF_DAY', 'MEDICAL', 'OTHER'] as const;

@Injectable()
export class GatePassService {
  constructor(private readonly prisma: PrismaService) {}

  async list(schoolId: string | undefined) {
    if (!schoolId) throw new BadRequestException('A school account is required');
    return this.prisma.gatePass.findMany({
      where: { schoolId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            rollNo: true,
            section: { select: { name: true, class: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(schoolId: string | undefined, userId: string, dto: CreateGatePassDto) {
    if (!schoolId) throw new BadRequestException('A school account is required');
    const studentId = String(dto?.studentId || '').trim();
    const reason = String(dto?.reason || '').trim();
    const reasonType = String(dto?.reasonType || 'EARLY_LEAVE').trim().toUpperCase();

    if (!studentId) throw new BadRequestException('Select a student');
    if (!reason) throw new BadRequestException('Gate pass reason is required');
    if (!REASON_TYPES.includes(reasonType as (typeof REASON_TYPES)[number])) {
      throw new BadRequestException('Invalid gate pass reason type');
    }

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId, deletedAt: null, isActive: true, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!student) {
      throw new BadRequestException('Selected student is not active in this school');
    }

    const id = randomUUID();
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const passNo = `GP-${dateCode}-${id.slice(0, 8).toUpperCase()}`;
    return this.prisma.gatePass.create({
      data: {
        id,
        passNo,
        reasonType,
        reason,
        status: 'APPROVED',
        issuedById: userId,
        approvedById: userId,
        issuedAt: new Date(),
        approvedAt: new Date(),
        schoolId,
        studentId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            rollNo: true,
            section: { select: { name: true, class: { select: { name: true } } } },
          },
        },
      },
    });
  }

  async markExit(schoolId: string | undefined, userId: string, id: string) {
    if (!schoolId) throw new BadRequestException('A school account is required');
    if (!id?.trim()) throw new BadRequestException('Gate pass ID is required');

    const result = await this.prisma.gatePass.updateMany({
      where: { id, schoolId, status: 'APPROVED' },
      data: { status: 'EXITED', exitAt: new Date(), exitMarkedById: userId },
    });
    if (result.count === 0) {
      const pass = await this.prisma.gatePass.findFirst({
        where: { id, schoolId },
        select: { id: true, status: true },
      });
      if (!pass) throw new NotFoundException('Gate pass not found');
      throw new BadRequestException('Only an approved pass can be marked as exited');
    }

    return this.prisma.gatePass.findFirst({
      where: { id, schoolId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            rollNo: true,
            section: { select: { name: true, class: { select: { name: true } } } },
          },
        },
      },
    });
  }
}
