import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const UNLIMITED = 999999;

@Injectable()
export class PlanCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async updatePlan(id: string, data: any) {
    const existing = await this.prisma.platformPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Plan not found');

    const features = Array.isArray(data.features)
      ? data.features.map((item: unknown) => String(item).trim()).filter(Boolean)
      : undefined;

    const numericFields = ['price', 'maxStudents', 'maxTeachers', 'storageMb'] as const;
    for (const field of numericFields) {
      if (data[field] === undefined) continue;
      const value = Number(data[field]);
      if (!Number.isFinite(value) || value < 0) {
        throw new BadRequestException(`${field} must be a non-negative number`);
      }
    }
    if (data.period !== undefined && !String(data.period).trim()) {
      throw new BadRequestException('period cannot be empty');
    }

    const updateData: any = {
      ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
      ...(data.price !== undefined ? { price: Number(data.price) } : {}),
      ...(data.period !== undefined ? { period: String(data.period).trim() } : {}),
      ...(data.maxStudents !== undefined ? { maxStudents: Number(data.maxStudents) } : {}),
      ...(data.maxTeachers !== undefined ? { maxTeachers: Number(data.maxTeachers) } : {}),
      ...(data.storageMb !== undefined ? { storageMb: Number(data.storageMb) } : {}),
      ...(data.supportTier !== undefined ? { supportTier: String(data.supportTier).trim() } : {}),
      ...(features !== undefined ? { features: JSON.stringify(features) } : {}),
    };

    if (updateData.maxStudents === 0) updateData.maxStudents = UNLIMITED;
    if (updateData.maxTeachers === 0) updateData.maxTeachers = UNLIMITED;

    return this.prisma.platformPlan.update({ where: { id }, data: updateData });
  }
}
