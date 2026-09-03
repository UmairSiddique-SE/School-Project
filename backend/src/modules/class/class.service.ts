import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string) {
    return this.prisma.class.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        sections: {
          where: { deletedAt: null },
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async createClass(schoolId: string, data: any) {
    if (!data.name?.trim()) throw new BadRequestException('Class name is required');

    // Only allow an academic year that belongs to the same school.
    let academicYearId = data.academicYearId;
    if (academicYearId) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: { id: academicYearId, schoolId },
      });
      if (!academicYear) throw new NotFoundException('Academic year not found');
    } else {
      const currentYear = await this.prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
      });
      academicYearId = currentYear?.id;
    }

    return this.prisma.class.create({
      data: {
        name: data.name.trim(),
        numeric: data.numeric ? parseInt(data.numeric, 10) : null,
        schoolId,
        academicYearId,
      },
    });
  }

  async deleteClass(id: string, schoolId: string) {
    const schoolClass = await this.prisma.class.findFirst({
      where: { id, schoolId, deletedAt: null },
    });
    if (!schoolClass) throw new NotFoundException('Class not found');

    return this.prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createSection(schoolId: string, data: any) {
    if (!data.name?.trim()) throw new BadRequestException('Section name is required');

    const parentClass = await this.prisma.class.findFirst({
      where: { id: data.classId, schoolId, deletedAt: null },
    });
    if (!parentClass) throw new NotFoundException('Class not found');

    if (data.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: data.teacherId, schoolId, deletedAt: null },
      });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }

    return this.prisma.section.create({
      data: {
        name: data.name.trim(),
        classId: data.classId,
        capacity: data.capacity ? parseInt(data.capacity, 10) : 40,
        teacherId: data.teacherId || null,
      },
    });
  }

  async deleteSection(id: string, schoolId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, class: { schoolId }, deletedAt: null },
    });
    if (!section) throw new NotFoundException('Section not found');

    return this.prisma.section.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getSubjects(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { schoolId, deletedAt: null },
    });
  }

  async createSubject(schoolId: string, data: any) {
    if (!data.name?.trim()) throw new BadRequestException('Subject name is required');

    return this.prisma.subject.create({
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
        schoolId,
      },
    });
  }
}
