import { PeopleService } from './people.service';

describe('PeopleService teacher profile scope', () => {
  const prisma = {
    teacher: { findMany: jest.fn() },
  };
  let service: PeopleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PeopleService(prisma as any);
    prisma.teacher.findMany.mockResolvedValue([]);
  });

  it('does not expose other teachers or payroll data to a teacher account', async () => {
    await service.getTeachers('school-1', 'teacher@example.com');

    expect(prisma.teacher.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: 'school-1',
        email: 'teacher@example.com',
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeNo: true,
      },
      orderBy: { name: 'asc' },
    });
  });
});
