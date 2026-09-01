import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceForSection(schoolId: string, sectionId: string, dateStr: string) {
    const date = new Date(dateStr);
    
    // Find all students in this section
    const students = await this.prisma.student.findMany({
      where: { sectionId, schoolId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    // Find attendance records for this date
    const records = await this.prisma.attendance.findMany({
      where: {
        sectionId,
        schoolId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });

    // Map students with their attendance status
    return students.map((student) => {
      const record = records.find((r) => r.studentId === student.id);
      return {
        studentId: student.id,
        name: student.name,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        status: record ? record.status : 'PRESENT', // default to PRESENT if not marked yet
        remarks: record ? record.remarks : '',
      };
    });
  }

  async markAttendance(schoolId: string, data: any) {
    const date = new Date(data.date);
    const records = data.records; // Array of { studentId, status, remarks }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });

    return this.prisma.$transaction(
      records.map((r: any) => {
        // Upsert attendance for each student on that date
        return this.prisma.attendance.upsert({
          where: {
            id: `${data.sectionId}-${r.studentId}-${data.date}`, // we can construct a deterministic token or search and update
          },
          create: {
            id: `${data.sectionId}-${r.studentId}-${data.date}`,
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
      })
    );
  }
}
