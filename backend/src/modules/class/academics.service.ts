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
      title: data.title.trim(), description: data.description?.trim() || '', dueDate,
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
    return this.prisma.timetable.findMany({ where, include: { section: { include: { class: true } }, subject: true, teacher: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
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
    return this.prisma.timetable.create({ data: { dayOfWeek, startTime: data.startTime, endTime: data.endTime, room: data.room || null, sectionId: data.sectionId, subjectId: data.subjectId, teacherId: data.teacherId } });
  }

  async deleteTimetable(id: string, schoolId: string) {
    const timetable = await this.prisma.timetable.findFirst({ where: { id, section: { class: { schoolId } } } });
    if (!timetable) throw new NotFoundException('Timetable entry not found');
    return this.prisma.timetable.delete({ where: { id } });
  }

  async getAnnouncements(schoolId: string, user?: any) {
    const now = new Date();
    const announcements = await this.prisma.announcement.findMany({ where: { schoolId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }] });
    if (!user?.role || user.role === 'SCHOOL_ADMIN') return announcements;
    return announcements.filter((a) => { const targets = String(a.targetRoles || 'ALL').split(',').map((v) => v.trim().toUpperCase()); return targets.includes('ALL') || targets.includes(user.role); });
  }

  async createAnnouncement(schoolId: string, data: any) {
    if (!data.title?.trim() || !data.content?.trim()) throw new BadRequestException('Title and content are required');
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new BadRequestException('Invalid expiry date');
    return this.prisma.announcement.create({ data: { title: data.title.trim(), content: data.content.trim(), targetRoles: data.targetRoles ? String(data.targetRoles) : 'ALL', isPinned: Boolean(data.isPinned), expiresAt, schoolId } });
  }

  async deleteAnnouncement(id: string, schoolId: string) {
    const announcement = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return this.prisma.announcement.delete({ where: { id } });
  }

  async getBooks(schoolId: string) {
    return this.prisma.book.findMany({ where: { schoolId, deletedAt: null }, orderBy: { title: 'asc' } });
  }

  async getBookIssues(schoolId: string, user?: any) {
    const where: any = { book: { schoolId } };
    if (user?.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({ where: { schoolId, email: user.email, deletedAt: null }, select: { id: true } });
      if (!student) return [];
      where.studentId = student.id;
    }
    return this.prisma.bookIssue.findMany({ where, include: { book: true, student: true }, orderBy: { issueDate: 'desc' } });
  }

  async createBook(schoolId: string, data: any) {
    const title = String(data.title || '').trim();
    const author = String(data.author || '').trim();
    const copies = Number(data.copies);
    if (!title || !author) throw new BadRequestException('Book title and author are required');
    if (!Number.isInteger(copies) || copies < 1) throw new BadRequestException('Copies must be at least 1');
    const isbn = data.isbn ? String(data.isbn).trim() : null;
    if (isbn) {
      const existing = await this.prisma.book.findUnique({ where: { isbn }, select: { id: true, deletedAt: true } });
      if (existing && !existing.deletedAt) throw new BadRequestException('ISBN already exists');
    }
    return this.prisma.book.create({ data: { schoolId, title, author, isbn, publisher: data.publisher?.trim() || null, category: data.category?.trim() || null, edition: data.edition?.trim() || null, copies, available: copies, coverUrl: data.coverUrl || null } });
  }

  async issueBook(schoolId: string, data: any) {
    if (!data.bookId || !data.studentId || !data.dueDate) throw new BadRequestException('Book, student and due date are required');
    const dueDate = new Date(data.dueDate);
    if (Number.isNaN(dueDate.getTime())) throw new BadRequestException('Invalid due date');
    if (dueDate.getTime() <= Date.now()) throw new BadRequestException('Due date must be in the future');
    return this.prisma.$transaction(async (tx) => {
      const book = await tx.book.findFirst({ where: { id: data.bookId, schoolId, deletedAt: null } });
      if (!book) throw new NotFoundException('Book not found');
      if (book.available < 1) throw new BadRequestException('No available copies');
      const student = await tx.student.findFirst({ where: { id: data.studentId, schoolId, deletedAt: null }, select: { id: true } });
      if (!student) throw new NotFoundException('Student not found');
      const activeIssue = await tx.bookIssue.findFirst({ where: { bookId: book.id, studentId: student.id, returnDate: null } });
      if (activeIssue) throw new BadRequestException('This student already has this book issued');
      const issue = await tx.bookIssue.create({ data: { bookId: book.id, studentId: student.id, dueDate, remarks: data.remarks?.trim() || null } });
      await tx.book.update({ where: { id: book.id }, data: { available: { decrement: 1 } } });
      return issue;
    });
  }

  async returnBook(schoolId: string, issueId: string, data: any = {}) {
    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.findFirst({ where: { id: issueId, book: { schoolId }, returnDate: null }, include: { book: true } });
      if (!issue) throw new NotFoundException('Active book issue not found');
      const returnDate = data.returnDate ? new Date(data.returnDate) : new Date();
      if (Number.isNaN(returnDate.getTime())) throw new BadRequestException('Invalid return date');
      if (returnDate.getTime() < issue.issueDate.getTime()) throw new BadRequestException('Return date cannot be before issue date');
      const fine = data.fine === undefined || data.fine === '' ? 0 : Number(data.fine);
      if (!Number.isFinite(fine) || fine < 0) throw new BadRequestException('Fine must be zero or greater');
      const updated = await tx.bookIssue.update({ where: { id: issue.id }, data: { returnDate, fine, remarks: data.remarks?.trim() || issue.remarks } });
      await tx.book.update({ where: { id: issue.bookId }, data: { available: { increment: 1 } } });
      return updated;
    });
  }

  async deleteBook(id: string, schoolId: string) {
    const book = await this.prisma.book.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!book) throw new NotFoundException('Book not found');
    const active = await this.prisma.bookIssue.count({ where: { bookId: id, returnDate: null } });
    if (active > 0) throw new BadRequestException('Return all active copies before archiving this book');
    return this.prisma.book.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getRoutes(schoolId: string) {
    return this.prisma.transportRoute.findMany({ where: { schoolId }, include: { vehicles: true }, orderBy: { name: 'asc' } });
  }

  async createRoute(schoolId: string, data: any) {
    if (!data.name?.trim() || !data.startPoint?.trim() || !data.endPoint?.trim()) throw new BadRequestException('Route name, start point and end point are required');
    const distance = data.distance === undefined || data.distance === null || data.distance === '' ? null : Number(data.distance);
    if (distance !== null && (!Number.isFinite(distance) || distance < 0)) throw new BadRequestException('Invalid route distance');
    return this.prisma.transportRoute.create({ data: { name: data.name.trim(), description: data.description?.trim() || null, startPoint: data.startPoint.trim(), endPoint: data.endPoint.trim(), stops: data.stops ? String(data.stops) : '', distance, schoolId } });
  }

  async deleteRoute(id: string, schoolId: string) {
    const route = await this.prisma.transportRoute.findFirst({ where: { id, schoolId }, include: { vehicles: { select: { id: true } } } });
    if (!route) throw new NotFoundException('Route not found');
    if (route.vehicles.length) throw new BadRequestException('Remove vehicles from this route before deleting it');
    return this.prisma.transportRoute.delete({ where: { id } });
  }

  async getVehicles(schoolId: string) {
    return this.prisma.vehicle.findMany({ where: { route: { schoolId } }, include: { route: true }, orderBy: { vehicleNo: 'asc' } });
  }

  async createVehicle(schoolId: string, data: any) {
    if (!data.vehicleNo?.trim() || !data.routeId) throw new BadRequestException('Vehicle number and route are required');
    const capacity = Number(data.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) throw new BadRequestException('Vehicle capacity must be at least 1');
    const route = await this.prisma.transportRoute.findFirst({ where: { id: data.routeId, schoolId } });
    if (!route) throw new NotFoundException('Route not found');
    const existing = await this.prisma.vehicle.findUnique({ where: { vehicleNo: data.vehicleNo.trim() }, select: { id: true } });
    if (existing) throw new BadRequestException('Vehicle number already exists');
    return this.prisma.vehicle.create({ data: { vehicleNo: data.vehicleNo.trim(), type: data.type?.trim() || 'Bus', capacity, driverName: data.driverName?.trim() || null, driverPhone: data.driverPhone?.trim() || null, gpsTrackerCode: data.gpsTrackerCode?.trim() || null, routeId: data.routeId } });
  }

  async deleteVehicle(id: string, schoolId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, route: { schoolId } }, include: { assignments: { select: { id: true } } } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.assignments.length) throw new BadRequestException('Remove student transport assignments before deleting this vehicle');
    return this.prisma.vehicle.delete({ where: { id } });
  }

  async getTransportAssignments(schoolId: string) {
    return this.prisma.transportAssignment.findMany({
      where: { vehicle: { route: { schoolId } } },
      include: {
        student: { select: { id: true, name: true, rollNo: true, admissionNo: true, schoolId: true } },
        vehicle: { include: { route: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTransportAssignment(schoolId: string, data: any) {
    const studentId = String(data.studentId || '').trim();
    const vehicleId = String(data.vehicleId || '').trim();
    if (!studentId || !vehicleId) throw new BadRequestException('Student and vehicle are required');

    const [student, vehicle, existing] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null }, select: { id: true } }),
      this.prisma.vehicle.findFirst({ where: { id: vehicleId, route: { schoolId } }, include: { route: true, _count: { select: { assignments: true } } } }),
      this.prisma.transportAssignment.findUnique({ where: { studentId }, select: { id: true } }),
    ]);
    if (!student) throw new NotFoundException('Student not found');
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (existing) throw new BadRequestException('This student already has a transport assignment');
    if (vehicle._count.assignments >= vehicle.capacity) throw new BadRequestException('Vehicle capacity is full');

    return this.prisma.transportAssignment.create({
      data: {
        studentId,
        vehicleId,
        pickupStop: data.pickupStop?.trim() || null,
        dropoffStop: data.dropoffStop?.trim() || null,
      },
      include: { student: true, vehicle: { include: { route: true } } },
    });
  }

  async updateTransportAssignment(id: string, schoolId: string, data: any) {
    const assignment = await this.prisma.transportAssignment.findFirst({
      where: { id, vehicle: { route: { schoolId } } },
      include: { vehicle: true, student: true },
    });
    if (!assignment) throw new NotFoundException('Transport assignment not found');

    const nextVehicleId = data.vehicleId ? String(data.vehicleId).trim() : assignment.vehicleId;
    if (!nextVehicleId) throw new BadRequestException('Vehicle is required');

    if (nextVehicleId !== assignment.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({ where: { id: nextVehicleId, route: { schoolId } }, include: { _count: { select: { assignments: true } } } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      if (vehicle._count.assignments >= vehicle.capacity) throw new BadRequestException('Vehicle capacity is full');
    }

    return this.prisma.transportAssignment.update({
      where: { id },
      data: {
        vehicleId: nextVehicleId,
        pickupStop: data.pickupStop === undefined ? assignment.pickupStop : String(data.pickupStop || '').trim() || null,
        dropoffStop: data.dropoffStop === undefined ? assignment.dropoffStop : String(data.dropoffStop || '').trim() || null,
      },
      include: { student: true, vehicle: { include: { route: true } } },
    });
  }

  async deleteTransportAssignment(id: string, schoolId: string) {
    const assignment = await this.prisma.transportAssignment.findFirst({ where: { id, vehicle: { route: { schoolId } } }, select: { id: true } });
    if (!assignment) throw new NotFoundException('Transport assignment not found');
    return this.prisma.transportAssignment.delete({ where: { id } });
  }
}
