import { ForbiddenException } from '@nestjs/common';
import { AcademicsService } from './academics.service';

describe('AcademicsService teacher scoping', () => {
  const prisma = {
    teacher: { findFirst: jest.fn() },
    homework: { findFirst: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
    timetable: { findMany: jest.fn() },
    student: { findFirst: jest.fn() },
  };
  let service: AcademicsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AcademicsService(prisma as any);
  });

  it('limits teacher homework to assignments created by their profile', async () => {
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
    prisma.homework.findMany.mockResolvedValue([]);

    await service.getHomework('school-1', {
      role: 'TEACHER',
      email: 'teacher@example.com',
    });

    expect(prisma.homework.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { schoolId: 'school-1', teacherId: 'teacher-1' },
    }));
  });

  it("prevents a teacher from deleting another teacher's homework", async () => {
    prisma.homework.findFirst.mockResolvedValue({ id: 'homework-1', teacherId: 'teacher-2' });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });

    await expect(service.deleteHomework(
      'homework-1',
      'school-1',
      'teacher@example.com',
    )).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.homework.delete).not.toHaveBeenCalled();
  });
});
