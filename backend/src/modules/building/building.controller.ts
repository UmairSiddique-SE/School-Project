import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { BuildingService } from './building.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  // ─── Buildings ────────────────────────────────────────────────────────────

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  findAll(@CurrentUser() user: any, @Query('schoolId') schoolId?: string) {
    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? schoolId : user.schoolId;
    return this.buildingService.findAllBuildings(effectiveSchoolId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? undefined : user.schoolId;
    return this.buildingService.findOneBuilding(id, effectiveSchoolId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  create(@CurrentUser() user: any, @Body() dto: any) {
    const schoolId = user.role === 'SUPER_ADMIN' ? (dto.schoolId || user.schoolId) : user.schoolId;
    return this.buildingService.createBuilding({ ...dto, schoolId });
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? undefined : user.schoolId;
    return this.buildingService.updateBuilding(id, dto, effectiveSchoolId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? undefined : user.schoolId;
    return this.buildingService.deleteBuilding(id, effectiveSchoolId);
  }

  // ─── Rooms ────────────────────────────────────────────────────────────────

  @Get(':buildingId/rooms')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  getRooms(@CurrentUser() user: any, @Param('buildingId') buildingId: string) {
    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? undefined : user.schoolId;
    return this.buildingService.findRooms(buildingId, effectiveSchoolId);
  }

  @Post(':buildingId/rooms')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  createRoom(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Body() dto: any,
  ) {
    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? undefined : user.schoolId;
    return this.buildingService.createRoom(buildingId, dto, effectiveSchoolId);
  }

  @Put(':buildingId/rooms/:roomId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  updateRoom(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Param('roomId') roomId: string,
    @Body() dto: any,
  ) {
    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? undefined : user.schoolId;
    return this.buildingService.updateRoom(buildingId, roomId, dto, effectiveSchoolId);
  }

  @Delete(':buildingId/rooms/:roomId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  deleteRoom(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Param('roomId') roomId: string,
  ) {
    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? undefined : user.schoolId;
    return this.buildingService.deleteRoom(buildingId, roomId, effectiveSchoolId);
  }
}
