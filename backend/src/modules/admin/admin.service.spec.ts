import { AdminService } from './admin.service';

describe('AdminService default subscription catalogue', () => {
  const prisma = {
    platformPlan: {
      count: jest.fn(),
      create: jest.fn(),
    },
    platformSetting: {
      count: jest.fn(),
      upsert: jest.fn(),
    },
    emailTemplate: {
      count: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.platformPlan.count.mockResolvedValue(0);
    prisma.platformPlan.create.mockResolvedValue({});
    prisma.platformSetting.count.mockResolvedValue(1);
    prisma.emailTemplate.count.mockResolvedValue(1);
  });

  it('seeds exactly one Professional plan with unlimited students', async () => {
    const service = new AdminService(prisma as any);
    await service.seedDefaults();

    expect(prisma.platformPlan.create).toHaveBeenCalledTimes(1);
    const plan = prisma.platformPlan.create.mock.calls[0][0].data;
    expect(plan.planKey).toBe('PROFESSIONAL');
    expect(plan.price).toBe(3000);
    expect(plan.maxStudents).toBe(999999);
    expect(plan.features).toContain('Unlimited students');
    expect(plan.features).not.toContain('500 students');
  });
});
