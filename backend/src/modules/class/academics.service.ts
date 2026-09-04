import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomework(schoolId: string) {
    return this.prisma.homework.findMany({
      where: { schoolId },
      include: { section: { include: { class: true } }, subject: true, teacher: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHomework(schoolId: string, teacherId: string | null, data: any) {
    if (!data.title?.trim() || !data.dueDate) {
      throw new BadRequestException('Title and due date are required');
    }
    if (!data.sectionId || !data.subjectId) {
      throw new BadRequestException('Section and subject are required');
    }

    const dueDate = new Date(data.dueDate);
    if (Number.isNaN(dueDate.getTime())) throw new BadRequestException('Invalid due date');

    const [section, subject] = await Promise.all([
      this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId }, deletedAt: null } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId, deletedAt: null } }),
    ]);
    if (!section) throw new NotFoundException('Section not found');
    if (!subject) throw new NotFoundException('Subject not found');

    const effectiveTeacherId = teacherId || data.teacherId || null;
    if (effectiveTeacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: effectiveTeacherId, schoolId, deletedAt: null } });
      if (!teacher) throw new NotFoundException('Teacher not found');

      const assignment = await this.prisma.classSubject.findFirst({
        where: { classId: section.classId, subjectId: data.subjectId, teacherId: effectiveTeacherId },
      });
      if (!assignment) {
        throw new ForbiddenException('Teacher is not assigned to this subject for the selected class');
      }
    }

    return this.prisma.homework.create({ data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      dueDate,
      attachmentUrl: data.attachmentUrl || null,
      schoolId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
      teacherId: effectiveTeacherId,
    } });
  }

  async deleteHomework(id: string, schoolId: string) {
    const homework = await this.prisma.homework.findFirst({ where: { id, schoolId } });
    if (!homework) throw new NotFoundException('Homework not found');
    return this.prisma.homework.delete({ where: { id } });
  }

  async getTimetables(schoolId: string) {
    return this.prisma.timetable.findMany({ where: { section: { class: { schoolId } } }, include: { section: { include: { class: true } }, subject: true, teacher: true } });
  }

  async createTimetable(schoolId: string, data: any) {
    const dayOfWeek = Number(data.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('Day of week must be between 0 and 6');
    }
    if (!data.startTime || !data.endTime || !data.sectionId || !data.subjectId || !data.teacherId) {
      throw new BadRequestException('Section, subject, teacher, start time and end time are required');
    }
    if (data.startTime >= data.endTime) throw new BadRequestException('End time must be after start time');

    const [section, subject, teacher] = await Promise.all([
      this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId }, deletedAt: null } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId, deletedAt: null } }),
      this.prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId, deletedAt: null } }),
    ]);
    if (!section) throw new NotFoundException('Section not found');
    if (!subject) throw new NotFoundException('Subject not found');
    if (!teacher) throw new NotFoundException('Teacher not found');

    const assignment = await this.prisma.classSubject.findFirst({
      where: { classId: section.classId, subjectId: data.subjectId, teacherId: data.teacherId },
    });
    if (!assignment) throw new ForbiddenException('Teacher is not assigned to this subject for the selected class');

    const conflict = await this.prisma.timetable.findFirst({
      where: {
        sectionId: data.sectionId,
        dayOfWeek,
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });
    if (conflict) throw new BadRequestException('This section already has a timetable entry in the selected time slot');

    return this.prisma.timetable.create({ data: {
      dayOfWeek, startTime: data.startTime, endTime: data.endTime, room: data.room || null,
      sectionId: data.sectionId, subjectId: data.subjectId, teacherId: data.teacherId,
    } });
  }

  async deleteTimetable(id: string, schoolId: string) {
    const timetable = await this.prisma.timetable.findFirst({ where: { id, section: { class: { schoolId } } } });
    if (!timetable) throw new NotFoundException('Timetable entry not found');
    return this.prisma.timetable.delete({ where: { id } });
  }

  async getAnnouncements(schoolId: string) {
    return this.prisma.announcement.findMany({ where: { schoolId }, orderBy: { publishedAt: 'desc' } });
  }

  async createAnnouncement(schoolId: string, data: any) {
    return this.prisma.announcement.create({ data: {
      title: data.title, content: data.content, targetRoles: data.targetRoles || 'ALL', isPinned: !!data.isPinned,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(), expiresAt: data.expiresAt ? new Date(data.expiresAt) : null, schoolId,
    } });
  }

  async deleteAnnouncement(id: string, schoolId: string) {
    return this.prisma.announcement.deleteMany({ where: { id, schoolId } });
  }

  async getRoutes(schoolId: string) {
    return this.prisma.transportRoute.findMany({ where: { schoolId }, include: { vehicles: true } });
  }

  async createRoute(schoolId: string, data: any) {
    return this.prisma.transportRoute.create({ data: {
      name: data.name, description: data.description || null, startPoint: data.startPoint, endPoint: data.endPoint,
      stops: JSON.stringify(data.stops || []), distance: data.distance ? parseFloat(data.distance) : null, schoolId,
    } });
  }

  async deleteRoute(id: string, schoolId: string) {
    return this.prisma.transportRoute.deleteMany({ where: { id, schoolId } });
  }

  async getVehicles(schoolId: string) {
    return this.prisma.vehicle.findMany({ where: { route: { schoolId } }, include: { route: true } });
  }

  async createVehicle(schoolId: string, data: any) {
    const route = await this.prisma.transportRoute.findFirst({ where: { id: data.routeId, schoolId } });
    if (!route) throw new NotFoundException('Route not found');
    return this.prisma.vehicle.create({ data: {
      vehicleNo: data.vehicleNo, type: data.type || 'Bus', capacity: parseInt(data.capacity, 10),
      driverName: data.driverName || null, driverPhone: data.driverPhone || null, routeId: data.routeId,
    } });
  }

  async deleteVehicle(id: string, schoolId: string) {
    return this.prisma.vehicle.deleteMany({ where: { id, route: { schoolId } } });
  }
}
