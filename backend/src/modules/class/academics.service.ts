import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Homework ──────────────────────────────────────────────────────────────
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
    return this.prisma.homework.create({
      data: {
        title: data.title,
        description: data.description,
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
    return this.prisma.homework.deleteMany({
      where: { id, schoolId },
    });
  }

  // ─── Timetables ─────────────────────────────────────────────────────────────
  async getTimetables(schoolId: string) {
    return this.prisma.timetable.findMany({
      where: { section: { class: { schoolId } } },
      include: {
        section: { include: { class: true } },
        subject: true,
        teacher: true,
      },
    });
  }

  async createTimetable(data: any) {
    return this.prisma.timetable.create({
      data: {
        dayOfWeek: parseInt(data.dayOfWeek, 10),
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room || null,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    });
  }

  async deleteTimetable(id: string) {
    return this.prisma.timetable.delete({
      where: { id },
    });
  }

  // ─── Notice Board (Announcements) ───────────────────────────────────────────
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
    return this.prisma.announcement.deleteMany({
      where: { id, schoolId },
    });
  }

  // ─── Transport ──────────────────────────────────────────────────────────────
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
    return this.prisma.transportRoute.deleteMany({
      where: { id, schoolId },
    });
  }

  async getVehicles(schoolId: string) {
    return this.prisma.vehicle.findMany({
      where: { route: { schoolId } },
      include: { route: true },
    });
  }

  async createVehicle(data: any) {
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

  async deleteVehicle(id: string) {
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
