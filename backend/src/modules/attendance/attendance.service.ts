import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceForSection(schoolId: string, sectionId: string, dateStr: string) {
    if (!sectionId) throw new BadRequestException('sectionId is required');
    const date = new Date(dateStr || new Date().toISOString().split('T')[0]);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, deletedAt: null, class: { schoolId } },
    });
    if (!section) throw new NotFoundException('Section not found');

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const [students, records] = await Promise.all([
      this.prisma.student.findMany({
        where: { sectionId, schoolId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      this.prisma.attendance.findMany({
        where: { sectionId, schoolId, date: { gte: start, lte: end } },
      }),
    ]);

    return students.map((student) => {
      const record = records.find((r) => r.studentId === student.id);
      return {
        studentId: student.id,
        name: student.name,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        status: record?.status || 'PRESENT',
        remarks: record?.remarks || '',
      };
    });
  }

  async markAttendance(schoolId: string, data: any) {
    if (!data.sectionId || !data.date || !Array.isArray(data.records)) {
      throw new BadRequestException('sectionId, date and records are required');
    }

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    const section = await this.prisma.section.findFirst({
      where: { id: data.sectionId, deletedAt: null, class: { schoolId } },
    });
    if (!section) throw new NotFoundException('Section not found');

    const studentIds = [...new Set(data.records.map((r: any) => String(r.studentId)))];
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, sectionId: data.sectionId, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (students.length !== studentIds.length) {
      throw new NotFoundException('One or more students do not belong to this section');
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });

    return this.prisma.$transaction(
      data.records.map((r: any) => {
        const recordId = `${data.sectionId}-${r.studentId}-${data.date}`;
        return this.prisma.attendance.upsert({
          where: { id: recordId },
          create: {
            id: recordId,
            date,
            status: r.status,
            remarks: r.remarks || null,
            schoolId,
            sectionId: data.sectionId,
            studentId: r.studentId,
            academicYearId: academicYear?.id || null,
          },
          update: {
            status: r.status,
            remarks: r.remarks || null,
          },
        });
      }),
    );
  }
}
