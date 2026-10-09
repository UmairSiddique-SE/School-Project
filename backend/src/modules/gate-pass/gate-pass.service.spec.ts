import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GatePassService } from './gate-pass.service';
import { PrismaService } from '../database/prisma.service';

describe('GatePassService', () => {
  const prisma = {
    student: { findFirst: jest.fn() },
    gatePass: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  let service: GatePassService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GatePassService(prisma as unknown as PrismaService);
  });

  it('creates an approved pass only for an active student in the same school', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
    prisma.gatePass.create.mockImplementation(async ({ data, include }) => ({ ...data, student: include ? { id: 'student-1', name: 'Student One' } : undefined }));

    const result = await service.create('school-1', 'admin-1', {
      studentId: 'student-1',
      reasonType: 'HALF_DAY',
      reason: 'Family appointment',
    });

    expect(prisma.student.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'student-1', schoolId: 'school-1', deletedAt: null, isActive: true, status: 'ACTIVE' },
    }));
    expect(result.passNo).toMatch(/^GP-\d{8}-[A-F0-9]{8}$/);
    expect(result.status).toBe('APPROVED');
    expect(result.issuedById).toBe('admin-1');
    expect(result.approvedById).toBe('admin-1');
  });

  it('rejects a student from another school or an inactive student', async () => {
    prisma.student.findFirst.mockResolvedValue(null);
    await expect(service.create('school-1', 'admin-1', {
      studentId: 'student-from-school-2',
      reasonType: 'EARLY_LEAVE',
      reason: 'Going home',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.gatePass.create).not.toHaveBeenCalled();
  });

  it('records the exit once and rejects repeated exits', async () => {
    prisma.gatePass.updateMany.mockResolvedValue({ count: 1 });
    prisma.gatePass.findFirst.mockResolvedValue({ id: 'pass-1', status: 'EXITED' });

    await service.markExit('school-1', 'guard-1', 'pass-1');

    expect(prisma.gatePass.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'pass-1', schoolId: 'school-1', status: 'APPROVED' },
      data: expect.objectContaining({ status: 'EXITED', exitMarkedById: 'guard-1', exitAt: expect.any(Date) }),
    }));

    prisma.gatePass.updateMany.mockResolvedValue({ count: 0 });
    prisma.gatePass.findFirst.mockResolvedValue({ id: 'pass-1', status: 'EXITED' });
    await expect(service.markExit('school-1', 'guard-1', 'pass-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not expose another school\'s pass', async () => {
    prisma.gatePass.updateMany.mockResolvedValue({ count: 0 });
    prisma.gatePass.findFirst.mockResolvedValue(null);
    await expect(service.markExit('school-1', 'admin-1', 'school-2-pass')).rejects.toBeInstanceOf(NotFoundException);
  });
});
