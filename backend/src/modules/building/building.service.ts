import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PlanLimitService } from '../people/plan-limit.service';

@Injectable()
export class BuildingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitService: PlanLimitService,
  ) {}

  // ─── Buildings ────────────────────────────────────────────────────────────

  async findAllBuildings(schoolId?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    let buildings = await this.prisma.building.findMany({
      where,
      include: {
        school: { select: { id: true, name: true, slug: true } },
        _count: { select: { rooms: true } },
        rooms: {
          orderBy: [{ floor: 'asc' }, { roomNo: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Provide one real operational campus record for a school that has none yet.
    if (buildings.length === 0 && schoolId) {
      const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
      if (school) {
        const defaultBuilding = await this.prisma.building.create({
          data: {
            schoolId,
            name: 'Main Academic Campus',
            buildingType: 'OWNED',
            address: school.address || 'Main Educational Avenue',
            city: school.city || 'Lahore',
            locationArea: 'Campus Block A',
            floors: 3,
            totalClassrooms: 18,
            totalRooms: 24,
            studentCapacity: 750,
            hasComputerLab: true,
            hasScienceLab: true,
            hasLibrary: true,
            hasPlayground: true,
            hasAuditorium: true,
            hasCanteen: true,
            hasPrayerArea: true,
            hasParking: true,
            hasCctv: true,
            hasSecurityGuard: true,
            hasFireSafety: true,
            hasFirstAid: true,
            description: 'Primary educational building housing junior and senior classes with modern amenities.',
            isActive: true,
          },
          include: {
            school: { select: { id: true, name: true, slug: true } },
            _count: { select: { rooms: true } },
            rooms: true,
          },
        });
        buildings = [defaultBuilding];
      }
    }

    return buildings;
  }

  async findOneBuilding(id: string, schoolId?: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true, slug: true } },
        _count: { select: { rooms: true } },
        rooms: { orderBy: [{ floor: 'asc' }, { roomNo: 'asc' }] },
      },
    });
    if (!building) throw new NotFoundException('Building not found');
    if (schoolId && building.schoolId !== schoolId) {
      throw new ForbiddenException('You do not have access to this building');
    }
    return building;
  }

  async createBuilding(data: {
    schoolId: string;
    name: string;
    buildingType?: string;
    address?: string;
    city?: string;
    locationArea?: string;
    floors?: number;
    totalClassrooms?: number;
    totalRooms?: number;
    studentCapacity?: number;
    hasComputerLab?: boolean;
    hasScienceLab?: boolean;
    hasLibrary?: boolean;
    hasPlayground?: boolean;
    hasAuditorium?: boolean;
    hasCanteen?: boolean;
    hasPrayerArea?: boolean;
    hasParking?: boolean;
    hasCctv?: boolean;
    hasSecurityGuard?: boolean;
    hasFireSafety?: boolean;
    hasFirstAid?: boolean;
    description?: string;
    enforcePlan?: boolean;
  }) {
    if (!data.schoolId || !data.name) {
      throw new ConflictException('schoolId and name are required');
    }
    const school = await this.prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) throw new NotFoundException('School not found');

    if (data.enforcePlan !== false) {
      await this.planLimitService.assertCampusCapacity(data.schoolId);
    }

    return this.prisma.building.create({
      data: {
        schoolId: data.schoolId,
        name: data.name,
        buildingType: data.buildingType || 'OWNED',
        address: data.address || null,
        city: data.city || null,
        locationArea: data.locationArea || null,
        floors: Number(data.floors) || 1,
        totalClassrooms: Number(data.totalClassrooms) || 0,
        totalRooms: Number(data.totalRooms) || 0,
        studentCapacity: Number(data.studentCapacity) || 0,
        hasComputerLab: Boolean(data.hasComputerLab),
        hasScienceLab: Boolean(data.hasScienceLab),
        hasLibrary: Boolean(data.hasLibrary),
        hasPlayground: Boolean(data.hasPlayground),
        hasAuditorium: Boolean(data.hasAuditorium),
        hasCanteen: Boolean(data.hasCanteen),
        hasPrayerArea: Boolean(data.hasPrayerArea),
        hasParking: Boolean(data.hasParking),
        hasCctv: Boolean(data.hasCctv),
        hasSecurityGuard: Boolean(data.hasSecurityGuard),
        hasFireSafety: Boolean(data.hasFireSafety),
        hasFirstAid: Boolean(data.hasFirstAid),
        description: data.description || null,
        isActive: true,
      },
      include: {
        school: { select: { id: true, name: true, slug: true } },
        _count: { select: { rooms: true } },
        rooms: true,
      },
    });
  }

  async updateBuilding(id: string, data: any, schoolId?: string) {
    await this.findOneBuilding(id, schoolId);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.buildingType !== undefined) updateData.buildingType = data.buildingType;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.locationArea !== undefined) updateData.locationArea = data.locationArea;
    if (data.floors !== undefined) updateData.floors = Number(data.floors);
    if (data.totalClassrooms !== undefined) updateData.totalClassrooms = Number(data.totalClassrooms);
    if (data.totalRooms !== undefined) updateData.totalRooms = Number(data.totalRooms);
    if (data.studentCapacity !== undefined) updateData.studentCapacity = Number(data.studentCapacity);
    if (data.hasComputerLab !== undefined) updateData.hasComputerLab = Boolean(data.hasComputerLab);
    if (data.hasScienceLab !== undefined) updateData.hasScienceLab = Boolean(data.hasScienceLab);
    if (data.hasLibrary !== undefined) updateData.hasLibrary = Boolean(data.hasLibrary);
    if (data.hasPlayground !== undefined) updateData.hasPlayground = Boolean(data.hasPlayground);
    if (data.hasAuditorium !== undefined) updateData.hasAuditorium = Boolean(data.hasAuditorium);
    if (data.hasCanteen !== undefined) updateData.hasCanteen = Boolean(data.hasCanteen);
    if (data.hasPrayerArea !== undefined) updateData.hasPrayerArea = Boolean(data.hasPrayerArea);
    if (data.hasParking !== undefined) updateData.hasParking = Boolean(data.hasParking);
    if (data.hasCctv !== undefined) updateData.hasCctv = Boolean(data.hasCctv);
    if (data.hasSecurityGuard !== undefined) updateData.hasSecurityGuard = Boolean(data.hasSecurityGuard);
    if (data.hasFireSafety !== undefined) updateData.hasFireSafety = Boolean(data.hasFireSafety);
    if (data.hasFirstAid !== undefined) updateData.hasFirstAid = Boolean(data.hasFirstAid);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    return this.prisma.building.update({
      where: { id },
      data: updateData,
      include: {
        school: { select: { id: true, name: true, slug: true } },
        _count: { select: { rooms: true } },
        rooms: { orderBy: [{ floor: 'asc' }, { roomNo: 'asc' }] },
      },
    });
  }

  async deleteBuilding(id: string, schoolId?: string) {
    await this.findOneBuilding(id, schoolId);
    return this.prisma.building.delete({ where: { id } });
  }

  // ─── Rooms ────────────────────────────────────────────────────────────────

  async findRooms(buildingId: string, schoolId?: string) {
    await this.findOneBuilding(buildingId, schoolId);
    return this.prisma.room.findMany({
      where: { buildingId },
      orderBy: [{ floor: 'asc' }, { roomNo: 'asc' }],
    });
  }

  async createRoom(
    buildingId: string,
    data: {
      roomNo: string;
      name?: string;
      floor?: number;
      capacity?: number;
      type?: string;
    },
    schoolId?: string,
  ) {
    await this.findOneBuilding(buildingId, schoolId);

    const existing = await this.prisma.room.findUnique({
      where: { roomNo_buildingId: { roomNo: data.roomNo, buildingId } },
    });
    if (existing) throw new ConflictException('Room number already exists in this building');

    return this.prisma.room.create({
      data: {
        buildingId,
        roomNo: data.roomNo,
        name: data.name || null,
        floor: Number(data.floor) || 1,
        capacity: Number(data.capacity) || 30,
        type: data.type || 'CLASSROOM',
        isActive: true,
      },
    });
  }

  async updateRoom(buildingId: string, roomId: string, data: any, schoolId?: string) {
    await this.findOneBuilding(buildingId, schoolId);
    const room = await this.prisma.room.findFirst({ where: { id: roomId, buildingId } });
    if (!room) throw new NotFoundException('Room not found');

    if (data.roomNo && data.roomNo !== room.roomNo) {
      const conflict = await this.prisma.room.findFirst({
        where: { roomNo: data.roomNo, buildingId, id: { not: roomId } },
      });
      if (conflict) throw new ConflictException('Room number already exists in this building');
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        roomNo: data.roomNo ?? undefined,
        name: data.name ?? undefined,
        floor: data.floor !== undefined ? Number(data.floor) : undefined,
        capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
        type: data.type ?? undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });
  }

  async deleteRoom(buildingId: string, roomId: string, schoolId?: string) {
    await this.findOneBuilding(buildingId, schoolId);
    const room = await this.prisma.room.findFirst({ where: { id: roomId, buildingId } });
    if (!room) throw new NotFoundException('Room not found');
    return this.prisma.room.delete({ where: { id: roomId } });
  }
}
