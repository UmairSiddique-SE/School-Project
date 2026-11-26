import { BadRequestException } from '@nestjs/common';
import { PlanCatalogService } from './plan-catalog.service';

describe('PlanCatalogService', () => {
  const prisma = {
    platformPlan: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: PlanCatalogService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.platformPlan.findUnique.mockResolvedValue({ id: 'plan-1' });
    prisma.platformPlan.update.mockImplementation(async ({ data }) => data);
    service = new PlanCatalogService(prisma as any);
  });

  it('rejects negative and non-finite prices', async () => {
    await expect(service.updatePlan('plan-1', { price: -1 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.updatePlan('plan-1', { price: 'abc' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.platformPlan.update).not.toHaveBeenCalled();
  });

  it('rejects an empty period', async () => {
    await expect(service.updatePlan('plan-1', { period: '   ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes zero limits to the unlimited sentinel', async () => {
    const result = await service.updatePlan('plan-1', {
      maxStudents: 0,
      maxTeachers: 0,
      period: 'per month',
    });
    expect(result.maxStudents).toBe(999999);
    expect(result.maxTeachers).toBe(999999);
    expect(result.period).toBe('per month');
  });
});
