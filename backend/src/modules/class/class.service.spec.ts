import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClassService } from './class.service';

describe('ClassService subject tenant scoping', () => {
  const prisma = {
    subject: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    class: {
      count: jest.fn(),
    },
    teacher: {
      findFirst: jest.fn(),
    },
    classSubject: {
      upsert: jest.fn(),
    },
  };
  let service: ClassService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.subject.findFirst.mockResolvedValue(null);
    prisma.subject.create.mockResolvedValue({ id: 'subject-1' });
    prisma.class.count.mockResolvedValue(1);
    prisma.teacher.findFirst.mockResolvedValue(null);
    prisma.classSubject.upsert.mockResolvedValue({ id: 'link-1' });
    service = new ClassService(prisma as any);
  });

  describe('ClassService teacher mapping access', () => {
    const mappingPrisma = {
      teacher: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      class: { findMany: jest.fn() },
      subject: { findMany: jest.fn() },
      timetable: { findMany: jest.fn() },
    };
    let mappingService: ClassService;

    beforeEach(() => {
      jest.clearAllMocks();
      mappingPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
      mappingPrisma.teacher.findMany.mockResolvedValue([]);
      mappingPrisma.class.findMany.mockResolvedValue([]);
      mappingPrisma.subject.findMany.mockResolvedValue([]);
      mappingPrisma.timetable.findMany.mockResolvedValue([]);
      mappingService = new ClassService(mappingPrisma as any);
    });

    it('limits a teacher mapping query to their own profile and assignments', async () => {
      await mappingService.getTeacherSubjectMapping('school-1', {
        role: 'TEACHER',
        email: 'teacher@example.com',
      });

      expect(mappingPrisma.teacher.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ schoolId: 'school-1', id: 'teacher-1' }),
      }));
      expect(mappingPrisma.class.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { sections: { some: { teacherId: 'teacher-1', deletedAt: null } } },
            { subjects: { some: { teacherId: 'teacher-1' } } },
          ],
        }),
        include: expect.objectContaining({
          sections: expect.objectContaining({
            where: { deletedAt: null, teacherId: 'teacher-1' },
          }),
          subjects: expect.objectContaining({
            where: { teacherId: 'teacher-1' },
          }),
        }),
      }));
      expect(mappingPrisma.timetable.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ teacherId: 'teacher-1' }),
      }));
    });

    it('rejects a teacher account without a matching active teacher profile', async () => {
      mappingPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(mappingService.getTeacherSubjectMapping('school-1', {
        role: 'TEACHER',
        email: 'missing@example.com',
      })).rejects.toBeInstanceOf(NotFoundException);

      expect(mappingPrisma.teacher.findMany).not.toHaveBeenCalled();
    });
  });

  it('rejects a class from another school', async () => {
    prisma.class.count.mockResolvedValue(0);
    await expect(
      service.createSubject('school-1', { name: 'Math', classIds: ['foreign-class'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.classSubject.upsert).not.toHaveBeenCalled();
  });

  it('accepts classes that belong to the caller school', async () => {
    await service.createSubject('school-1', {
      name: 'Math',
      classIds: ['class-1'],
    });
    expect(prisma.class.count).toHaveBeenCalledWith({
      where: { id: { in: ['class-1'] }, schoolId: 'school-1', deletedAt: null },
    });
    expect(prisma.classSubject.upsert).toHaveBeenCalled();
  });
});
