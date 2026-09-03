import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomework(schoolId: string) {
    return this.prisma.homework.findMany({
      where: { schoolId },
      include: {
        section: { include: { class: true } },
        subject: true,
        teacher: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHomework(schoolId: string, teacherId: string | null, data: any) {
    const section = await this.prisma.section.findFirst({
      where: { id: data.sectionId, class: { schoolId }, deletedAt: null },
    });
    if (!section) throw new NotFoundException('Section not found');

    const subject = await this.prisma.subject.findFirst({
      where: { id: data.subjectId, schoolId, deletedAt: null },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    if (teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: teacherId, schoolId } });
      if (!teacher) throw new NotFoundException('Teacher not found');
    } else if (data.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId } });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }

    return this.prisma.homework.create({
      data: {
        title: data.title,
        description: data.description || null,
        dueDate: new Date(data.dueDate),
        attachmentUrl: data.attachmentUrl || null,
        schoolId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: teacherId || data.teacherId || null,
      },
    });
  }

  async deleteHomework(id: string, schoolId: string) {
    return this.prisma.homework.deleteMany({ where: { id, schoolId } });
  }

  async getTimetables(schoolId: string) {
    return this.prisma.timetable.findMany({
      where: { section: { class: { schoolId } } },
      include: {
        section: { include: { class: true } },
        subject: true,
        teacher: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createTimetable(schoolId: string, data: any) {
    const section = await this.prisma.section.findFirst({
      where: { id: data.sectionId, class: { schoolId }, deletedAt: null },
    });
    if (!section) throw new NotFoundException('Section not found');

    const subject = await this.prisma.subject.findFirst({
      where: { id: data.subjectId, schoolId, deletedAt: null },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    if (data.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId } });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }

    return this.prisma.timetable.create({
      data: {
        dayOfWeek: parseInt(data.dayOfWeek, 10),
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room || null,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: data.teacherId || null,
      },
    });
  }

  async deleteTimetable(id: string, schoolId: string) {
    const timetable = await this.prisma.timetable.findFirst({
      where: { id, section: { class: { schoolId } } },
    });
    if (!timetable) throw new NotFoundException('Timetable entry not found');
    return this.prisma.timetable.delete({ where: { id } });
  }

  async getAnnouncements(schoolId: string) {
    return this.prisma.announcement.findMany({
      where: { schoolId },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async createAnnouncement(schoolId: string, data: any) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        targetRoles: data.targetRoles || 'ALL',
        isPinned: !!data.isPinned,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        schoolId,
      },
    });
  }

  async deleteAnnouncement(id: string, schoolId: string) {
    return this.prisma.announcement.deleteMany({ where: { id, schoolId } });
  }

  async getRoutes(schoolId: string) {
    return this.prisma.transportRoute.findMany({
      where: { schoolId },
      include: { vehicles: true },
    });
  }

  async createRoute(schoolId: string, data: any) {
    return this.prisma.transportRoute.create({
      data: {
        name: data.name,
        description: data.description || null,
        startPoint: data.startPoint,
        endPoint: data.endPoint,
        stops: JSON.stringify(data.stops || []),
        distance: data.distance ? parseFloat(data.distance) : null,
        schoolId,
      },
    });
  }

  async deleteRoute(id: string, schoolId: string) {
    return this.prisma.transportRoute.deleteMany({ where: { id, schoolId } });
  }

  async getVehicles(schoolId: string) {
    return this.prisma.vehicle.findMany({
      where: { route: { schoolId } },
      include: { route: true },
    });
  }

  async createVehicle(schoolId: string, data: any) {
    const route = await this.prisma.transportRoute.findFirst({ where: { id: data.routeId, schoolId } });
    if (!route) throw new NotFoundException('Route not found');

    return this.prisma.vehicle.create({
      data: {
        vehicleNo: data.vehicleNo,
        type: data.type || 'Bus',
        capacity: parseInt(data.capacity, 10),
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
        routeId: data.routeId,
      },
    });
  }

  async deleteVehicle(id: string, schoolId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, route: { schoolId } } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
