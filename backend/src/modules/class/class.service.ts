import { Injectable, NotFoundException } from '@nestjs/common';
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
    // Get or create active academic year if not supplied
    let academicYearId = data.academicYearId;
    if (!academicYearId) {
      const currentYear = await this.prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
      });
      academicYearId = currentYear?.id;
    }

    return this.prisma.class.create({
      data: {
        name: data.name,
        numeric: data.numeric ? parseInt(data.numeric, 10) : null,
        schoolId,
        academicYearId,
      },
    });
  }

  async deleteClass(id: string, schoolId: string) {
    return this.prisma.class.updateMany({
      where: { id, schoolId },
      data: { deletedAt: new Date() },
    });
  }

  async createSection(schoolId: string, data: any) {
    const parentClass = await this.prisma.class.findFirst({
      where: { id: data.classId, schoolId },
    });
    if (!parentClass) throw new NotFoundException('Class not found');
    if (data.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId } });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }

    return this.prisma.section.create({
      data: {
        name: data.name,
        classId: data.classId,
        capacity: data.capacity ? parseInt(data.capacity, 10) : 40,
        teacherId: data.teacherId || null,
      },
    });
  }

  async deleteSection(id: string, schoolId: string) {
    // Verify ownership
    const section = await this.prisma.section.findFirst({
      where: { id, class: { schoolId } },
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
    return this.prisma.subject.create({
      data: {
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        schoolId,
      },
    });
  }
}
