import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getStudentAttendance(schoolId: string, email: string) {
    const student = await this.prisma.student.findFirst({
      where: { schoolId, email: email?.toLowerCase(), deletedAt: null },
      select: { id: true, name: true, admissionNo: true, rollNo: true },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const records = await this.prisma.attendance.findMany({
      where: { schoolId, studentId: student.id },
      orderBy: { date: 'desc' },
    });
    return records.map((record) => ({
      id: record.id,
      studentId: student.id,
      name: student.name,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      date: record.date,
      status: record.status,
      remarks: record.remarks || '',
    }));
  }

  async getSchoolAttendanceSummary(schoolId: string) {
    const grouped = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: { _all: true },
    });
    const summary = { total: 0, present: 0, absent: 0, late: 0, leave: 0 };
    for (const row of grouped) {
      const count = row._count._all;
      summary.total += count;
      if (row.status === 'PRESENT') summary.present += count;
      else if (row.status === 'ABSENT') summary.absent += count;
      else if (row.status === 'LATE') summary.late += count;
      else if (row.status === 'LEAVE') summary.leave += count;
    }
    return summary;
  }

  async getAttendanceForSection(schoolId: string, sectionId: string, dateStr: string, user?: any) {
    if (!sectionId) throw new BadRequestException('Section is required');
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, deletedAt: null, class: { schoolId, deletedAt: null } },
      select: { id: true, teacherId: true },
    });
    if (!section) throw new BadRequestException('Section does not belong to this school');
    await this.assertTeacherSectionAccess(schoolId, section.teacherId, user);

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
        date,
      };
    });
  }

  async markAttendance(schoolId: string, data: any, user?: any) {
    if (!data?.sectionId || !data?.date || !Array.isArray(data.records)) {
      throw new BadRequestException('sectionId, date and records are required');
    }
    if (!data.records.length) throw new BadRequestException('At least one attendance record is required');

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid attendance date');
    const statusValues = new Set(['PRESENT', 'ABSENT', 'LATE', 'LEAVE']);
    for (const record of data.records) {
      if (!record?.studentId || typeof record.studentId !== 'string') {
        throw new BadRequestException('Every attendance record must have a valid studentId');
      }
      if (!statusValues.has(String(record.status || 'PRESENT').toUpperCase())) {
        throw new BadRequestException('Attendance status must be PRESENT, ABSENT, LATE, or LEAVE');
      }
      if (record.remarks !== undefined && record.remarks !== null && String(record.remarks).length > 500) {
        throw new BadRequestException('Attendance remarks cannot exceed 500 characters');
      }
    }

    const section = await this.prisma.section.findFirst({
      where: { id: data.sectionId, deletedAt: null, class: { schoolId, deletedAt: null } },
      select: { id: true, name: true, teacherId: true },
    });
    if (!section) throw new BadRequestException('Section does not belong to this school');
    await this.assertTeacherSectionAccess(schoolId, section.teacherId, user);

    const studentIds: string[] = Array.from(new Set(
      data.records
        .map((r: any) => r.studentId)
        .filter((id: any): id is string => typeof id === 'string' && id.length > 0),
    ));
    if (studentIds.length !== data.records.length) {
      throw new BadRequestException('Duplicate or invalid student attendance records were supplied');
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
    const normalizedDate = data.date.length === 10 ? `${data.date}T00:00:00` : data.date;
    const dateKey = String(data.date).slice(0, 10);
    const saved = await this.prisma.$transaction(
      data.records.map((r: any) => {
        const status = String(r.status || 'PRESENT').toUpperCase();
        return this.prisma.attendance.upsert({
          where: { id: `${data.sectionId}-${r.studentId}-${dateKey}` },
          create: {
            id: `${data.sectionId}-${r.studentId}-${dateKey}`,
            date: new Date(normalizedDate),
            status,
            remarks: r.remarks ? String(r.remarks).trim() : null,
            schoolId,
            sectionId: data.sectionId,
            studentId: r.studentId,
            academicYearId: academicYear?.id || null,
          },
          update: { status, remarks: r.remarks ? String(r.remarks).trim() : null },
        });
      }),
    );

    const admins = await this.prisma.user.findMany({
      where: { schoolId, role: 'SCHOOL_ADMIN', isActive: true, deletedAt: null },
      select: { id: true },
    });
    const intendedEmails = Array.from(new Set(
      students.flatMap((student) => [
        ...(student.email ? [student.email] : []),
        ...student.parents.map((parent) => parent.parent.email).filter((email): email is string => Boolean(email)),
      ]),
    ));
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
      return userIds.length ? [{ userIds: Array.from(new Set(userIds)), title: 'Attendance Updated', message: `${student.name}'s attendance was marked ${statusLabel} for ${dateKey}.` }] : [];
    });

    for (const job of notificationJobs) {
      await this.notificationService.createForUsers(job.userIds, schoolId, {
        type: 'ATTENDANCE', title: job.title, message: job.message, link: '/notifications',
      });
    }
    if (admins.length) {
      await this.notificationService.createForUsers(admins.map((admin) => admin.id), schoolId, {
        type: 'ATTENDANCE', title: 'Attendance Published',
        message: `Attendance for ${students.length} student(s) in Section ${section.name} was updated for ${dateKey}.`,
        link: '/notifications',
      });
    }
    return saved;
  }

  private async assertTeacherSectionAccess(schoolId: string, sectionTeacherId: string | null, user?: any) {
    if (!user || user.role === 'SCHOOL_ADMIN') return;
    if (user.role !== 'TEACHER') throw new ForbiddenException('You are not allowed to manage attendance');
    const teacher = await this.prisma.teacher.findFirst({
      where: { schoolId, email: user.email, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!teacher || teacher.id !== sectionTeacherId) {
      throw new ForbiddenException('Teachers can only manage attendance for their assigned section');
    }
  }
}
