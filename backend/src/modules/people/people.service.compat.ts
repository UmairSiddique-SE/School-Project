import { NotFoundException } from '@nestjs/common';
import { PeopleService } from './people.service';

/**
 * Compatibility restoration for staff/stats methods that are part of the
 * PeopleController contract. Kept isolated so the main service can be cleaned
 * up safely in a later refactor without changing the API surface.
 */
declare module './people.service' {
  interface PeopleService {
    deleteStaff(id: string, schoolId: string): Promise<any>;
    getSchoolStats(schoolId: string): Promise<any>;
  }
}

PeopleService.prototype.deleteStaff = async function (id: string, schoolId: string) {
  const service = this as any;
  const staff = await service.prisma.staff.findFirst({ where: { id, schoolId } });
  if (staff) {
    return service.prisma.$transaction(async (tx: any) => {
      await tx.staff.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
      await tx.user.updateMany({
        where: { email: staff.email, schoolId },
        data: { isActive: false, deletedAt: new Date() },
      });
    });
  }

  const teacher = await service.prisma.teacher.findFirst({ where: { id, schoolId } });
  if (teacher) return service.deleteTeacher(id, schoolId);
  throw new NotFoundException('Staff member not found');
};

PeopleService.prototype.getSchoolStats = async function (schoolId: string) {
  const service = this as any;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    studentsCount,
    teachersCount,
    parentsCount,
    staffCount,
    classesCount,
    pendingHomeworks,
    pendingLeaves,
    overdueLibraryBooks,
    attendances,
    feePayments,
    announcements,
    recentAdmissions,
    upcomingExams,
  ] = await Promise.all([
    service.prisma.student.count({ where: { schoolId, deletedAt: null } }),
    service.prisma.teacher.count({ where: { schoolId, deletedAt: null } }),
    service.prisma.parent.count({ where: { schoolId, deletedAt: null } }),
    service.prisma.staff.count({ where: { schoolId, deletedAt: null } }),
    service.prisma.class.count({ where: { schoolId, deletedAt: null } }),
    service.prisma.homework.count({ where: { schoolId, dueDate: { gte: new Date() } } }),
    service.prisma.leaveRequest.count({ where: { schoolId, status: 'PENDING' } }),
    service.prisma.bookIssue.count({ where: { book: { schoolId }, returnDate: null, dueDate: { lt: new Date() } } }),
    service.prisma.attendance.findMany({ where: { schoolId, date: { gte: today, lt: tomorrow }, studentId: { not: null } }, select: { status: true } }),
    service.prisma.feePayment.findMany({ where: { schoolId }, select: { totalPaid: true, amount: true, status: true } }),
    service.prisma.announcement.findMany({ where: { schoolId }, take: 5, orderBy: { publishedAt: 'desc' } }),
    service.prisma.student.findMany({ where: { schoolId, deletedAt: null }, take: 5, orderBy: { admissionDate: 'desc' }, select: { id: true, name: true, admissionDate: true, section: { select: { class: { select: { name: true } } } } } }),
    service.prisma.exam.findMany({ where: { schoolId, deletedAt: null, startDate: { gte: today } }, take: 5, orderBy: { startDate: 'asc' }, select: { id: true, name: true, type: true, startDate: true } }),
  ]);

  const totalTodayAttendance = attendances.length;
  const presentToday = attendances.filter((a: any) => a.status === 'PRESENT').length;
  const absentToday = attendances.filter((a: any) => a.status === 'ABSENT').length;
  const todayAttendancePercentage = totalTodayAttendance > 0
    ? Math.round((presentToday / totalTodayAttendance) * 100)
    : 0;
  const totalRevenue = feePayments.reduce((acc: number, curr: any) => acc + (curr.totalPaid || 0), 0);
  const pendingFees = feePayments
    .filter((p: any) => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((acc: number, curr: any) => acc + (curr.amount - curr.totalPaid), 0);
  const pendingFeePaymentsCount = feePayments.filter((p: any) => p.status === 'PENDING' || p.status === 'OVERDUE').length;

  return {
    studentsCount,
    teachersCount,
    parentsCount,
    staffCount,
    classesCount,
    todayAttendancePercentage,
    presentToday,
    absentToday,
    totalRevenue,
    pendingFees,
    pendingFeePaymentsCount,
    pendingHomeworks,
    pendingLeaves,
    overdueLibraryBooks,
    announcements,
    recentAdmissions,
    upcomingExams,
  };
};
