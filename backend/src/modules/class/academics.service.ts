import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomework(schoolId: string, user?: any) {
    const where: any = { schoolId };
    if (user?.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({ where: { schoolId, email: user.email, deletedAt: null }, select: { sectionId: true } });
      if (!student?.sectionId) return [];
      where.sectionId = student.sectionId;
    }
    return this.prisma.homework.findMany({ where, include: { section: { include: { class: true } }, subject: true, teacher: true }, orderBy: { createdAt: 'desc' } });
  }

  async createHomework(schoolId: string, teacherEmail: string | null, data: any) {
    if (!data.title?.trim() || !data.dueDate) throw new BadRequestException('Title and due date are required');
    if (!data.sectionId || !data.subjectId) throw new BadRequestException('Section and subject are required');
    const dueDate = new Date(data.dueDate);
    if (Number.isNaN(dueDate.getTime())) throw new BadRequestException('Invalid due date');
    const [section, subject] = await Promise.all([
      this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId }, deletedAt: null } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId, deletedAt: null } }),
    ]);
    if (!section) throw new NotFoundException('Section not found');
    if (!subject) throw new NotFoundException('Subject not found');
    let effectiveTeacherId: string | undefined = data.teacherId ? String(data.teacherId) : undefined;
    if (teacherEmail) {
      const teacher = await this.prisma.teacher.findFirst({ where: { schoolId, email: teacherEmail, deletedAt: null, isActive: true } });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
      effectiveTeacherId = teacher.id;
    }
    if (effectiveTeacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: effectiveTeacherId, schoolId, deletedAt: null } });
      if (!teacher) throw new NotFoundException('Teacher not found');
      const assignment = await this.prisma.classSubject.findFirst({ where: { classId: section.classId, subjectId: data.subjectId, teacherId: effectiveTeacherId } });
      if (!assignment) throw new ForbiddenException('Teacher is not assigned to this subject for the selected class');
    }
    if (!effectiveTeacherId) throw new BadRequestException('Teacher is required');
    return this.prisma.homework.create({ data: {
      title: data.title.trim(), description: data.description?.trim() || null, dueDate,
      attachmentUrl: data.attachmentUrl || null, schoolId, sectionId: data.sectionId,
      subjectId: data.subjectId, teacherId: effectiveTeacherId,
    } });
  }

  async deleteHomework(id: string, schoolId: string) {
    const homework = await this.prisma.homework.findFirst({ where: { id, schoolId } });
    if (!homework) throw new NotFoundException('Homework not found');
    return this.prisma.homework.delete({ where: { id } });
  }

  async getTimetables(schoolId: string, user?: any) {
    const where: any = { section: { class: { schoolId } } };
    if (user?.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({ where: { schoolId, email: user.email, deletedAt: null }, select: { sectionId: true } });
      if (!student?.sectionId) return [];
      where.sectionId = student.sectionId;
    }
    return this.prisma.timetable.findMany({ where, include: { section: { include: { class: true } }, subject: true, teacher: true } });
  }

  async createTimetable(schoolId: string, data: any) {
    const dayOfWeek = Number(data.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) throw new BadRequestException('Day of week must be between 0 and 6');
    if (!data.startTime || !data.endTime || !data.sectionId || !data.subjectId || !data.teacherId) throw new BadRequestException('Section, subject, teacher, start time and end time are required');
    if (data.startTime >= data.endTime) throw new BadRequestException('End time must be after start time');
    const [section, subject, teacher] = await Promise.all([
      this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId }, deletedAt: null } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId, deletedAt: null } }),
      this.prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId, deletedAt: null } }),
    ]);
    if (!section) throw new NotFoundException('Section not found');
    if (!subject) throw new NotFoundException('Subject not found');
    if (!teacher) throw new NotFoundException('Teacher not found');
    const assignment = await this.prisma.classSubject.findFirst({ where: { classId: section.classId, subjectId: data.subjectId, teacherId: data.teacherId } });
    if (!assignment) throw new ForbiddenException('Teacher is not assigned to this subject for the selected class');
    const conflict = await this.prisma.timetable.findFirst({ where: { sectionId: data.sectionId, dayOfWeek, startTime: { lt: data.endTime }, endTime: { gt: data.startTime } } });
    if (conflict) throw new BadRequestException('This section already has a timetable entry in the selected time slot');
    return this.prisma.timetable.create({ data: {
      dayOfWeek, startTime: data.startTime, endTime: data.endTime, room: data.room || null,
      sectionId: data.sectionId, subjectId: data.subjectId, teacherId: data.teacherId,
    } });
  }
}