import { BadRequestException } from '@nestjs/common';
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
