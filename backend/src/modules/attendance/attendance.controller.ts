import {
  Controller, Get, Post, Body, Query, Param, UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  getAttendance(
    @CurrentUser() user: any,
    @Query('sectionId') sectionId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getAttendanceForSection(user.schoolId, sectionId, date);
  }

  @Get('section/:sectionId')
  getAttendanceBySection(
    @CurrentUser() user: any,
    @Param('sectionId') sectionId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getAttendanceForSection(user.schoolId, sectionId, date || new Date().toISOString().split('T')[0]);
  }

  @Post()
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  markAttendance(@CurrentUser() user: any, @Body() dto: any) {
    return this.attendanceService.markAttendance(user.schoolId, dto);
  }

  @Post('mark')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  markAttendanceAlias(@CurrentUser() user: any, @Body() dto: any) {
    return this.attendanceService.markAttendance(user.schoolId, dto);
  }
}
