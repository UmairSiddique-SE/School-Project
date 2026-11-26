import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string, role?: string, teacherEmail?: string) {
    if (!schoolId) throw new UnauthorizedException('School association missing for class data');
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
          include: {
            teacher: { select: { id: true, name: true, email: true } },
            _count: { select: { students: { where: { deletedAt: null } } } },
          },
        },
        subjects: {
          ...(isTeacher ? { where: { teacher: { email: teacherEmail, deletedAt: null } } } : {}),
          include: {
            subject: { select: { id: true, name: true, code: true, description: true } },
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { numeric: 'asc' },
    });
  }

  async findSections(schoolId: string, role?: string, teacherEmail?: string) {
    const classes = await this.findAll(schoolId, role, teacherEmail);
    return classes.flatMap((schoolClass: any) =>
      (schoolClass.sections || []).map((section: any) => ({
        ...section,
        classId: schoolClass.id,
        className: schoolClass.name,
        class: { id: schoolClass.id, name: schoolClass.name },
        studentCount: section._count?.students || 0,
      })),
    );
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

  // ─── Subjects Management ───
  async getSubjects(schoolId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        classSubjects: {
          include: {
            class: { select: { id: true, name: true } },
            teacher: { select: { id: true, name: true, employeeNo: true } },
          },
        },
        _count: { select: { timetables: true, results: true, homeworks: true } },
      },
      orderBy: { name: 'asc' },
    });

    return subjects.map((sub) => {
      let isOptional = false;
      let subjectType = 'COMPULSORY';
      let creditHours = 1;
      let rawDescription = sub.description || '';

      if (rawDescription.startsWith('{') && rawDescription.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawDescription);
          subjectType = parsed.type || (parsed.isOptional ? 'OPTIONAL' : 'COMPULSORY');
          isOptional = subjectType === 'OPTIONAL' || Boolean(parsed.isOptional);
          creditHours = parsed.creditHours || 1;
          rawDescription = parsed.description || '';
        } catch {
          // keep fallback
        }
      } else if (rawDescription.toUpperCase().includes('OPTIONAL')) {
        isOptional = true;
        subjectType = 'OPTIONAL';
      }

      return {
        ...sub,
        isOptional,
        subjectType,
        creditHours,
        cleanDescription: rawDescription,
        assignedClassesCount: sub.classSubjects.length,
        assignedClasses: sub.classSubjects.map((cs) => ({
          assignmentId: cs.id,
          classId: cs.class.id,
          className: cs.class.name,
          teacherId: cs.teacher?.id || null,
          teacherName: cs.teacher?.name || null,
          employeeNo: cs.teacher?.employeeNo || null,
        })),
      };
    });
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

    const subjectType = data.subjectType || (data.isOptional ? 'OPTIONAL' : 'COMPULSORY');
    const metaObj = {
      type: subjectType,
      isOptional: subjectType === 'OPTIONAL' || Boolean(data.isOptional),
      creditHours: Number(data.creditHours) || 1,
      description: data.description?.trim() || '',
    };
    const description = JSON.stringify(metaObj);

    const subject = await this.prisma.subject.create({
      data: { name, code, description, schoolId },
    });

    if (Array.isArray(data.classIds) && data.classIds.length > 0) {
      await this.assertClassIdsBelongToSchool(schoolId, data.classIds);
      if (data.teacherId) await this.assertTeacherBelongsToSchool(schoolId, data.teacherId);
      for (const classId of data.classIds) {
        await this.prisma.classSubject.upsert({
          where: { classId_subjectId: { classId, subjectId: subject.id } },
          create: { classId, subjectId: subject.id, teacherId: data.teacherId || null },
          update: { teacherId: data.teacherId || null },
        });
      }
    }

    return subject;
  }

  async updateSubject(id: string, schoolId: string, data: any) {
    const subject = await this.prisma.subject.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Subject not found');

    const name = data.name !== undefined ? String(data.name).trim() : subject.name;
    if (!name) throw new BadRequestException('Subject name cannot be empty');
    const code = data.code !== undefined ? (data.code ? String(data.code).trim() : null) : subject.code;

    if (name !== subject.name || code !== subject.code) {
      const duplicate = await this.prisma.subject.findFirst({
        where: {
          id: { not: id },
          schoolId,
          deletedAt: null,
          OR: [{ name }, ...(code ? [{ code }] : [])],
        },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('Another subject with this name or code already exists');
    }

    const subjectType = data.subjectType || (data.isOptional ? 'OPTIONAL' : 'COMPULSORY');
    const metaObj = {
      type: subjectType,
      isOptional: subjectType === 'OPTIONAL' || Boolean(data.isOptional),
      creditHours: Number(data.creditHours) || 1,
      description: data.description !== undefined ? String(data.description).trim() : '',
    };
    const description = JSON.stringify(metaObj);

    const updated = await this.prisma.subject.update({
      where: { id },
      data: { name, code, description },
    });

    if (Array.isArray(data.classIds)) {
      await this.assertClassIdsBelongToSchool(schoolId, data.classIds);
      if (data.teacherId) await this.assertTeacherBelongsToSchool(schoolId, data.teacherId);
      await this.prisma.classSubject.deleteMany({ where: { subjectId: id } });
      for (const classId of data.classIds) {
        await this.prisma.classSubject.create({
          data: { classId, subjectId: id, teacherId: data.teacherId || null },
        });
      }
    }

    return updated;
  }

  async deleteSubject(id: string, schoolId: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Subject not found');

    await this.prisma.classSubject.deleteMany({ where: { subjectId: id } });
    return this.prisma.subject.update({ where: { id }, data: { deletedAt: new Date() } });
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

  // ─── Teacher ↔ Section ↔ Subject Mapping Matrix ───
  async getTeacherSubjectMapping(schoolId: string) {
    const [teachers, classes, subjects, timetables] = await Promise.all([
      this.prisma.teacher.findMany({
        where: { schoolId, deletedAt: null, isActive: true },
        select: {
          id: true,
          name: true,
          employeeNo: true,
          email: true,
          phone: true,
          qualification: true,
          avatarUrl: true,
          classSubjects: {
            include: {
              class: { select: { id: true, name: true } },
              subject: { select: { id: true, name: true, code: true } },
            },
          },
          sectionTeacher: {
            where: { deletedAt: null },
            include: { class: { select: { id: true, name: true } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.class.findMany({
        where: { schoolId, deletedAt: null },
        include: {
          sections: {
            where: { deletedAt: null },
            include: { teacher: { select: { id: true, name: true } } },
          },
          subjects: {
            include: {
              subject: { select: { id: true, name: true, code: true, description: true } },
              teacher: { select: { id: true, name: true, employeeNo: true } },
            },
          },
        },
        orderBy: { numeric: 'asc' },
      }),
      this.prisma.subject.findMany({
        where: { schoolId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      this.prisma.timetable.findMany({
        where: { section: { class: { schoolId, deletedAt: null } } },
        select: { id: true, teacherId: true, sectionId: true, subjectId: true, dayOfWeek: true },
      }),
    ]);

    return {
      teachers: teachers.map((t) => {
        const weeklyPeriods = timetables.filter((tt) => tt.teacherId === t.id).length;
        return {
          id: t.id,
          name: t.name,
          employeeNo: t.employeeNo,
          email: t.email,
          phone: t.phone,
          qualification: t.qualification,
          avatarUrl: t.avatarUrl,
          assignedSubjects: t.classSubjects.map((cs) => ({
            id: cs.id,
            classId: cs.class.id,
            className: cs.class.name,
            subjectId: cs.subject.id,
            subjectName: cs.subject.name,
            subjectCode: cs.subject.code,
          })),
          classTeacherOf: t.sectionTeacher.map((s) => ({
            sectionId: s.id,
            sectionName: s.name,
            className: s.class.name,
          })),
          totalWeeklyPeriods: weeklyPeriods,
        };
      }),
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        sections: c.sections.map((s) => ({
          id: s.id,
          name: s.name,
          classTeacher: s.teacher ? { id: s.teacher.id, name: s.teacher.name } : null,
        })),
        subjects: c.subjects.map((cs) => ({
          assignmentId: cs.id,
          subjectId: cs.subject.id,
          subjectName: cs.subject.name,
          subjectCode: cs.subject.code,
          teacher: cs.teacher ? { id: cs.teacher.id, name: cs.teacher.name, employeeNo: cs.teacher.employeeNo } : null,
        })),
      })),
      subjects,
    };
  }

  // ─── Academic Years ───
  async getAcademicYears(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      include: {
        _count: { select: { classes: true, exams: true, attendances: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createAcademicYear(schoolId: string, data: any) {
    const name = String(data.name || '').trim();
    if (!name) throw new BadRequestException('Academic session name is required (e.g. 2026-2027)');

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Valid start and end dates are required');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const isCurrent = Boolean(data.isCurrent);
    if (isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.create({
      data: { name, startDate, endDate, isCurrent, schoolId },
    });
  }

  async updateAcademicYear(id: string, schoolId: string, data: any) {
    const existing = await this.prisma.academicYear.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Academic year not found');

    const updateData: any = {};
    if (data.name) updateData.name = String(data.name).trim();
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    if (data.isCurrent === true) {
      await this.prisma.academicYear.updateMany({
        where: { schoolId, isCurrent: true, id: { not: id } },
        data: { isCurrent: false },
      });
      updateData.isCurrent = true;
    }

    return this.prisma.academicYear.update({ where: { id }, data: updateData });
  }

  async setCurrentAcademicYear(id: string, schoolId: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, schoolId } });
    if (!year) throw new NotFoundException('Academic year not found');

    await this.prisma.academicYear.updateMany({
      where: { schoolId, isCurrent: true },
      data: { isCurrent: false },
    });

    return this.prisma.academicYear.update({
      where: { id },
      data: { isCurrent: true },
    });
  }

  async deleteAcademicYear(id: string, schoolId: string) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id, schoolId },
      include: { _count: { select: { classes: true, exams: true } } },
    });
    if (!year) throw new NotFoundException('Academic year not found');
    if (year.isCurrent) throw new BadRequestException('Cannot delete the currently active academic session');
    if (year._count.classes > 0 || year._count.exams > 0) {
      throw new BadRequestException('Cannot delete session with linked classes or exams');
    }

    return this.prisma.academicYear.delete({ where: { id } });
  }

  private async assertClassIdsBelongToSchool(schoolId: string, classIds: unknown[]) {
    const ids = [...new Set(classIds.map((value) => String(value)))];
    const count = await this.prisma.class.count({
      where: { id: { in: ids }, schoolId, deletedAt: null },
    });
    if (count !== ids.length) {
      throw new BadRequestException('One or more selected classes do not belong to this school');
    }
  }

  private async assertTeacherBelongsToSchool(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: String(teacherId), schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!teacher) throw new BadRequestException('Selected teacher does not belong to this school');
  }
}
