import { PeopleController } from './people.controller';

describe('PeopleController parent data scope', () => {
  const prisma = {
    user: { findFirst: jest.fn() },
    parent: { findFirst: jest.fn() },
  };
  let controller: PeopleController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PeopleController({} as any, {} as any, prisma as any);
    prisma.user.findFirst.mockResolvedValue({
      id: 'parent-user-1',
      schoolId: 'school-1',
      role: 'PARENT',
    });
    prisma.parent.findFirst.mockResolvedValue(null);
  });

  it('only includes published exam results in a parent portal profile', async () => {
    await controller.getMe({
      id: 'parent-user-1',
      schoolId: 'school-1',
      role: 'PARENT',
    });

    expect(prisma.parent.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({
        students: expect.objectContaining({
          include: expect.objectContaining({
            student: expect.objectContaining({
              include: expect.objectContaining({
                examResults: expect.objectContaining({
                  where: { exam: { isPublished: true, deletedAt: null } },
                }),
              }),
            }),
          }),
        }),
      }),
    }));
  });
});
