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
            students: { where: { deletedAt: null }, select: { id: true, name: true, rollNo: true } },
          },
        },
      },
    });
  }

  async findAllForTeacher(schoolId: string, teacherEmail: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { schoolId, email: teacherEmail, deletedAt: null, isActive: true } });
    if (!teacher) return [];
    const [sections, mappings] = await Promise.all([
      this.prisma.section.findMany({ where: { deletedAt: null, teacherId: teacher.id, class: { schoolId, deletedAt: null } }, include: { class: true, students: { where: { deletedAt: null }, select: { id: true, name: true, rollNo: true } } } }),
      this.prisma.classSubject.findMany({ where: { teacherId: teacher.id, class: { schoolId, deletedAt: null }, subject: { deletedAt: null } }, include: { class: true, subject: true } }),
    ]);
    const classMap = new Map<string, any>();
    for (const s of sections) {
      const row = classMap.get(s.classId) || { id: s.classId, name: s.class.name, sections: [] };
      row.sections.push({ id: s.id, name: s.name, classId: s.classId, teacher: { id: teacher.id, name: teacher.name }, students: s.students });
      classMap.set(s.classId, row);
    }
    for (const m of mappings) {
      const row = classMap.get(m.classId) || { id: m.classId, name: m.class.name, sections: [] };
      row.subject = m.subject.name;
      row.subjectCode = m.subject.code;
      classMap.set(m.classId, row);
    }
    return Array.from(classMap.values());
  }

  async createClass(schoolId: string, data: any) {
    let academicYearId = data.academicYearId;
    if (!academicYearId) academicYearId = (await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } }))?.id;
    return this.prisma.class.create({ data: { name: data.name, numeric: data.numeric ? parseInt(data.numeric, 10) : null, schoolId, academicYearId } });
  }

  async deleteClass(id: string, schoolId: string) { return this.prisma.class.updateMany({ where: { id, schoolId }, data: { deletedAt: new Date() } }); }

  async createSection(schoolId: string, data: any) {
    const parentClass = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId } });
    if (!parentClass) throw new NotFoundException('Class not found');
    if (data.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId } });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }
    return this.prisma.section.create({ data: { name: data.name, classId: data.classId, capacity: data.capacity ? parseInt(data.capacity, 10) : 40, teacherId: data.teacherId || null } });
  }

  async deleteSection(id: string, schoolId: string) {
    const section = await this.prisma.section.findFirst({ where: { id, class: { schoolId } } });
    if (!section) throw new NotFoundException('Section not found');
    return this.prisma.section.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getSubjects(schoolId: string) { return this.prisma.subject.findMany({ where: { schoolId, deletedAt: null } }); }

  async createSubject(schoolId: string, data: any) {
    return this.prisma.subject.create({ data: { name: data.name, code: data.code || null, description: data.description || null, schoolId } });
  }
}