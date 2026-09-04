import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string, role?: string, teacherEmail?: string) {
    const isTeacher = role === 'TEACHER' && Boolean(teacherEmail);
    return this.prisma.class.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(isTeacher
          ? {
              OR: [
                { sections: { some: { deletedAt: null, teacher: { email: teacherEmail, deletedAt: null } } } },
                { subjects: { some: { teacher: { email: teacherEmail, deletedAt: null } } } },
              ],
            }
          : {}),
      },
      include: {
        sections: {
          where: {
            deletedAt: null,
            ...(isTeacher ? { teacher: { email: teacherEmail, deletedAt: null } } : {}),
          },
          include: { teacher: { select: { id: true, name: true, email: true } } },
        },
        subjects: {
          ...(isTeacher ? { where: { teacher: { email: teacherEmail, deletedAt: null } } } : {}),
          include: {
            subject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async createClass(schoolId: string, data: any) {
    const name = String(data.name || '').trim();
    if (!name) throw new BadRequestException('Class name is required');

    const duplicate = await this.prisma.class.findFirst({
      where: { schoolId, name, deletedAt: null },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('A class with this name already exists');

    let academicYearId = data.academicYearId;
    if (academicYearId) {
      const academicYear = await this.prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } });
      if (!academicYear) throw new NotFoundException('Academic year not found');
    } else {
      const currentYear = await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
      academicYearId = currentYear?.id;
    }

    const numeric = data.numeric === undefined || data.numeric === null || data.numeric === ''
      ? null
      : Number(data.numeric);
    if (numeric !== null && (!Number.isInteger(numeric) || numeric < 0 || numeric > 100)) {
      throw new BadRequestException('Class numeric value must be a whole number between 0 and 100');
    }

    return this.prisma.class.create({ data: { name, numeric, schoolId, academicYearId } });
  }

  async deleteClass(id: string, schoolId: string) {
    const schoolClass = await this.prisma.class.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!schoolClass) throw new NotFoundException('Class not found');
    return this.prisma.class.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async createSection(schoolId: string, data: any) {
    const name = String(data.name || '').trim();
    if (!name) throw new BadRequestException('Section name is required');

    const parentClass = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId, deletedAt: null } });
    if (!parentClass) throw new NotFoundException('Class not found');

    const duplicate = await this.prisma.section.findFirst({
      where: { classId: data.classId, name, deletedAt: null },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('A section with this name already exists in this class');

    const capacity = data.capacity === undefined || data.capacity === null || data.capacity === '' ? 40 : Number(data.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
      throw new BadRequestException('Section capacity must be between 1 and 5000');
    }

    if (data.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId, deletedAt: null } });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }

    return this.prisma.section.create({ data: { name, classId: data.classId, capacity, teacherId: data.teacherId || null } });
  }

  async deleteSection(id: string, schoolId: string) {
    const section = await this.prisma.section.findFirst({ where: { id, class: { schoolId }, deletedAt: null } });
    if (!section) throw new NotFoundException('Section not found');
    return this.prisma.section.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getSubjects(schoolId: string) {
    return this.prisma.subject.findMany({ where: { schoolId, deletedAt: null }, orderBy: { name: 'asc' } });
  }

  async createSubject(schoolId: string, data: any) {
    const name = String(data.name || '').trim();
    if (!name) throw new BadRequestException('Subject name is required');
    const code = data.code ? String(data.code).trim() : null;

    const duplicate = await this.prisma.subject.findFirst({
      where: { schoolId, deletedAt: null, OR: [{ name }, ...(code ? [{ code }] : [])] },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('A subject with this name or code already exists');

    return this.prisma.subject.create({ data: { name, code, description: data.description?.trim() || null, schoolId } });
  }

  async assignSubjectTeacher(schoolId: string, data: any) {
    if (!data.classId || !data.subjectId) throw new BadRequestException('Class and subject are required');
    const schoolClass = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId, deletedAt: null } });
    if (!schoolClass) throw new NotFoundException('Class not found');
    const subject = await this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Subject not found');
    if (data.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId, deletedAt: null } });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }
    const existing = await this.prisma.classSubject.findFirst({ where: { classId: data.classId, subjectId: data.subjectId } });
    if (existing) {
      return this.prisma.classSubject.update({ where: { id: existing.id }, data: { teacherId: data.teacherId || null } });
    }
    return this.prisma.classSubject.create({ data: { classId: data.classId, subjectId: data.subjectId, teacherId: data.teacherId || null } });
  }

  async removeSubjectTeacher(id: string, schoolId: string) {
    const assignment = await this.prisma.classSubject.findFirst({
      where: { id, class: { schoolId, deletedAt: null }, subject: { schoolId, deletedAt: null } },
    });
    if (!assignment) throw new NotFoundException('Subject assignment not found');
    return this.prisma.classSubject.delete({ where: { id } });
  }
}
