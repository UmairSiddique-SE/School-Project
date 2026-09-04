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
      where: { id: sectionId, class: { schoolId } },
      select: { id: true },
    });
    if (!section) throw new BadRequestException('Section does not belong to this school');

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid attendance date');
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const students = await this.prisma.student.findMany({
      where: { sectionId, schoolId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    const records = await this.prisma.attendance.findMany({
      where: { sectionId, schoolId, date: { gte: start, lte: end } },
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
      where: { id: data.sectionId, class: { schoolId } },
      select: { id: true, name: true },
    });
    if (!section) throw new BadRequestException('Section does not belong to this school');

    const studentIds: string[] = [...new Set(
      data.records.map((r: any) => r.studentId).filter((id: any): id is string => typeof id === 'string' && id.length > 0),
    )];
    if (studentIds.length !== data.records.length) {
      throw new BadRequestException('Every attendance record must have a valid studentId');
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, sectionId: data.sectionId, schoolId, deletedAt: null },
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

    const academicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
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

    const admins = await this.prisma.user.findMany({
      where: { schoolId, role: 'SCHOOL_ADMIN', isActive: true, deletedAt: null },
      select: { id: true },
    });
    const intendedEmails = [...new Set(
      students.flatMap((student) => [
        ...(student.email ? [student.email] : []),
        ...student.parents.map((parent) => parent.parent.email).filter((email): email is string => Boolean(email)),
      ]),
    )];
    const recipients = await this.prisma.user.findMany({
      where: { schoolId, isActive: true, deletedAt: null, email: { in: intendedEmails } },
      select: { id: true, email: true },
    });
    const byEmail = new Map(recipients.map((recipient) => [recipient.email.toLowerCase(), recipient.id]));

    const notificationJobs = data.records.flatMap((record: any) => {
      const student = students.find((item) => item.id === record.studentId);
      if (!student) return [];
      const statusLabel = String(record.status || 'PRESENT').replace(/_/g, ' ');
      const emails = [
        ...(student.email ? [student.email] : []),
        ...student.parents.map((parent) => parent.parent.email).filter((email): email is string => Boolean(email)),
      ];
      const userIds = emails.map((email) => byEmail.get(email.toLowerCase())).filter((id): id is string => Boolean(id));
      return userIds.length ? [{ userIds: [...new Set(userIds)], title: 'Attendance Updated', message: `${student.name}'s attendance was marked ${statusLabel} for ${data.date}.` }] : [];
    });

    for (const job of notificationJobs) {
      await this.notificationService.createForUsers(job.userIds, schoolId, {
        type: 'ATTENDANCE', title: job.title, message: job.message, link: '/notifications',
      });
    }
    if (admins.length) {
      await this.notificationService.createForUsers(admins.map((admin) => admin.id), schoolId, {
        type: 'ATTENDANCE', title: 'Attendance Published',
        message: `Attendance for ${students.length} student(s) in Section ${section.name} was updated for ${data.date}.`,
        link: '/notifications',
      });
    }
    return saved;
  }
}
