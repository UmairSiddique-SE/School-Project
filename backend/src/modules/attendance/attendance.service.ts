import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceForSection(schoolId: string, sectionId: string, dateStr: string) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid attendance date');
    const students = await this.prisma.student.findMany({ where: { sectionId, schoolId, deletedAt: null }, orderBy: { name: 'asc' } });
    const records = await this.prisma.attendance.findMany({ where: { sectionId, schoolId, date: { gte: new Date(date.setHours(0, 0, 0, 0)), lte: new Date(date.setHours(23, 59, 59, 999)) } } });
    return students.map(student => {
      const record = records.find(r => r.studentId === student.id);
      return { studentId: student.id, name: student.name, rollNo: student.rollNo, admissionNo: student.admissionNo, status: record?.status || 'PRESENT', remarks: record?.remarks || '' };
    });
  }

  async markAttendance(schoolId: string, data: any, teacherEmail?: string) {
    if (!data?.sectionId || !data?.date || !Array.isArray(data.records)) throw new BadRequestException('Section, date and attendance records are required');
    const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, deletedAt: null, class: { schoolId, deletedAt: null } }, include: { students: { where: { deletedAt: null }, select: { id: true } } } });
    if (!section) throw new BadRequestException('Section not found');

    let teacherId: string | null = null;
    if (teacherEmail) {
      const teacher = await this.prisma.teacher.findFirst({ where: { email: teacherEmail, schoolId, deletedAt: null, isActive: true } });
      if (!teacher) throw new ForbiddenException('Teacher profile is not active');
      const assignedSection = await this.prisma.section.findFirst({ where: { id: section.id, teacherId: teacher.id, deletedAt: null } });
      const assignedSubject = await this.prisma.classSubject.findFirst({ where: { teacherId: teacher.id, classId: section.classId } });
      if (!assignedSection && !assignedSubject) throw new ForbiddenException('This section is not assigned to you');
      teacherId = teacher.id;
    }

    const allowedStudents = new Set(section.students.map(s => s.id));
    for (const r of data.records) if (!allowedStudents.has(r.studentId)) throw new BadRequestException('Attendance contains a student outside this section');

    const academicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
    const date = new Date(data.date);
    return this.prisma.$transaction(data.records.map((r: any) => this.prisma.attendance.upsert({
      where: { id: `${data.sectionId}-${r.studentId}-${data.date}` },
      create: { id: `${data.sectionId}-${r.studentId}-${data.date}`, date, status: r.status, remarks: r.remarks || null, schoolId, sectionId: data.sectionId, studentId: r.studentId, teacherId, academicYearId: academicYear?.id || null },
      update: { status: r.status, remarks: r.remarks || null, teacherId },
    })));
  }
}