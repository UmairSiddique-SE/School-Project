import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private prisma: PrismaService) {}

  async getHomework(schoolId: string) {
    return this.prisma.homework.findMany({ where: { schoolId }, include: { subject: true, section: { include: { class: true } }, teacher: true }, orderBy: { createdAt: 'desc' } });
  }

  async createHomework(schoolId: string, teacherId: string, data: any) {
    let tId = teacherId;
    if (!tId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { schoolId } });
      tId = teacher?.id || '';
    }
    const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId } } });
    if (!section) throw new BadRequestException('Invalid section for this school');
    return this.prisma.homework.create({ data: { schoolId, teacherId: tId, title: data.title, description: data.description, dueDate: new Date(data.dueDate), sectionId: data.sectionId, subjectId: data.subjectId } });
  }

  async deleteHomework(id: string, schoolId: string) {
    return this.prisma.homework.deleteMany({ where: { id, schoolId } });
  }

  async getTimetables(schoolId: string) {
    return this.prisma.timetable.findMany({ where: { section: { class: { schoolId } } }, include: { subject: true, teacher: true, section: { include: { class: true } } }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
  }

  async createTimetable(schoolId: string, data: any) {
    const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId } } });
    if (!section) throw new BadRequestException('Invalid section for this school');
    return this.prisma.timetable.create({ data: { dayOfWeek: parseInt(data.dayOfWeek, 10), startTime: data.startTime, endTime: data.endTime, sectionId: data.sectionId, subjectId: data.subjectId, teacherId: data.teacherId, room: data.room || null } });
  }

  async deleteTimetable(id: string, schoolId: string) {
    return this.prisma.timetable.deleteMany({ where: { id, section: { class: { schoolId } } } });
  }

  async getAnnouncements(schoolId: string) {
    return this.prisma.announcement.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
  }

  async createAnnouncement(schoolId: string, data: any) {
    return this.prisma.announcement.create({ data: { schoolId, title: data.title, content: data.content, targetRoles: data.targetRoles || 'ALL', isPinned: data.isPinned || false } });
  }

  async deleteAnnouncement(id: string, schoolId: string) {
    return this.prisma.announcement.deleteMany({ where: { id, schoolId } });
  }

  async getBooks(schoolId: string) {
    return this.prisma.book.findMany({ where: { schoolId, deletedAt: null }, orderBy: { title: 'asc' } });
  }

  async getBookIssues(schoolId: string) {
    return this.prisma.bookIssue.findMany({ where: { book: { schoolId } }, include: { book: true, student: true }, orderBy: { issueDate: 'desc' } });
  }

  async createBook(schoolId: string, data: any) {
    const copies = parseInt(data.copies, 10) || 1;
    if (copies < 1) throw new BadRequestException('Copies must be at least 1');
    return this.prisma.book.create({ data: { schoolId, title: data.title, author: data.author, isbn: data.isbn || null, category: data.category || null, copies, available: copies } });
  }

  async issueBook(schoolId: string, data: any) {
    const book = await this.prisma.book.findFirst({ where: { id: data.bookId, schoolId, deletedAt: null } });
    if (!book || book.available < 1) throw new NotFoundException('Book not available');
    const student = await this.prisma.student.findFirst({ where: { id: data.studentId, schoolId } });
    if (!student) throw new BadRequestException('Invalid student for this school');
    await this.prisma.book.update({ where: { id: book.id }, data: { available: book.available - 1 } });
    return this.prisma.bookIssue.create({ data: { bookId: data.bookId, studentId: data.studentId, dueDate: new Date(data.dueDate) } });
  }

  async deleteBook(id: string, schoolId: string) {
    return this.prisma.book.updateMany({ where: { id, schoolId }, data: { deletedAt: new Date() } });
  }

  async getRoutes(schoolId: string) {
    return this.prisma.transportRoute.findMany({ where: { schoolId }, include: { vehicles: true } });
  }

  async getVehicles(schoolId: string) {
    return this.prisma.vehicle.findMany({ where: { route: { schoolId } }, include: { route: true } });
  }

  async createRoute(schoolId: string, data: any) {
    return this.prisma.transportRoute.create({ data: { schoolId, name: data.name, startPoint: data.startPoint, endPoint: data.endPoint, stops: data.stops || '[]' } });
  }

  async createVehicle(schoolId: string, data: any) {
    const route = await this.prisma.transportRoute.findFirst({ where: { id: data.routeId, schoolId } });
    if (!route) throw new BadRequestException('Invalid route for this school');
    return this.prisma.vehicle.create({ data: { vehicleNo: data.vehicleNo, capacity: parseInt(data.capacity, 10) || 40, driverName: data.driverName, driverPhone: data.driverPhone, routeId: data.routeId } });
  }

  async deleteRoute(id: string, schoolId: string) {
    return this.prisma.transportRoute.deleteMany({ where: { id, schoolId } });
  }

  async deleteVehicle(id: string, schoolId: string) {
    return this.prisma.vehicle.deleteMany({ where: { id, route: { schoolId } } });
  }
}
