import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAttendanceForSection(schoolId: string, sectionId: string, dateStr: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, schoolId },
      select: { id: true },
    });
    if (!section) throw new BadRequestException('Section does not belong to this school');

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid attendance date');

    const students = await this.prisma.student.findMany({
      where: { sectionId, schoolId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

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

    return students.map((student) => {
      const record = records.find((r) => r.studentId === student.id);
      return {
        studentId: student.id,
        name: student.name,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        status: record ? record.status : 'PRESENT',
        remarks: record ? record.remarks : '',
      };
    });
  }

  async markAttendance(schoolId: string, data: any) {
    if (!data?.sectionId || !data?.date || !Array.isArray(data.records)) {
      throw new BadRequestException('sectionId, date and records are required');
    }

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid attendance date');

    const section = await this.prisma.section.findFirst({
      where: { id: data.sectionId, schoolId },
      select: { id: true, name: true },
    });
    if (!section) throw new BadRequestException('Section does not belong to this school');

    const studentIds = [...new Set(data.records.map((r: any) => r.studentId).filter(Boolean))];
    if (studentIds.length !== data.records.length) {
      throw new BadRequestException('Every attendance record must have a valid studentId');
    }

    const students = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
        sectionId: data.sectionId,
        schoolId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        parents: { select: { parent: { select: { email: true } } } },
      },
    });
    if (students.length !== studentIds.length) {
      throw new BadRequestException('One or more students do not belong to this school/section');
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });

    const saved = await this.prisma.$transaction(
      data.records.map((r: any) => this.prisma.attendance.upsert({
        where: { id: `${data.sectionId}-${r.studentId}-${data.date}` },
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
        update: { status: r.status, remarks: r.remarks || null },
      })),
    );

    // Attendance is a single source of truth: persist an in-app notification for
    // the affected student, linked parents, and school admins. No fake/local fallback.
    const admins = await this.prisma.user.findMany({
      where: { schoolId, role: 'SCHOOL_ADMIN', isActive: true, deletedAt: null },
      select: { id: true },
    });
    const studentEmails = students.map(s => s.email).filter((email): email is string => Boolean(email));
    const parentEmails = students.flatMap(s => s.parents.map(p => p.parent.email)).filter((email): email is string => Boolean(email));
    const recipients = await this.prisma.user.findMany({
      where: {
        schoolId,
        isActive: true,
        deletedAt: null,
        email: { in: [...new Set([...studentEmails, ...parentEmails])] },
      },
      select: { id: true, email: true },
    });

    const userIds = [
      ...admins.map(a => a.id),
      ...recipients.map(r => r.id),
    ];
    if (data.notifyParents !== false) {
      const byEmail = new Map(recipients.map(r => [r.email.toLowerCase(), r.id]));
      const intendedEmails = [...new Set([...studentEmails, ...parentEmails])];
      const intendedIds = intendedEmails.map(email => byEmail.get(email.toLowerCase())).filter((id): id is string => Boolean(id));
      await this.notificationService.createForUsers(
        [...new Set([...admins.map(a => a.id), ...intendedIds])],
        schoolId,
        {
          type: 'ATTENDANCE',
          title: 'Attendance Updated',
          message: `Attendance for ${students.length} student(s) in Section ${section.name} was updated for ${data.date}.`,
          link: '/attendance',
        },
      );
    } else {
      await this.notificationService.createForUsers(userIds.filter(id => admins.some(a => a.id === id)), schoolId, {
        type: 'ATTENDANCE',
        title: 'Attendance Updated',
        message: `Attendance for ${students.length} student(s) in Section ${section.name} was updated for ${data.date}.`,
        link: '/attendance',
      });
    }

    return saved;
  }
}
