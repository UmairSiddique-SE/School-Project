import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academics')
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}
  @Get('homework') getHomework(@CurrentUser() user: any) { return this.academicsService.getHomework(user.schoolId); }
  @Post('homework') @Roles('SCHOOL_ADMIN', 'TEACHER') createHomework(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createHomework(user.schoolId, null, dto); }
  @Delete('homework/:id') @Roles('SCHOOL_ADMIN', 'TEACHER') deleteHomework(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteHomework(id, user.schoolId); }
  @Get('timetables') getTimetables(@CurrentUser() user: any) { return this.academicsService.getTimetables(user.schoolId); }
  @Post('timetables') @Roles('SCHOOL_ADMIN') createTimetable(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createTimetable(user.schoolId, dto); }
  @Delete('timetables/:id') @Roles('SCHOOL_ADMIN') deleteTimetable(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteTimetable(id, user.schoolId); }
  @Get('announcements') getAnnouncements(@CurrentUser() user: any) { return this.academicsService.getAnnouncements(user.schoolId); }
  @Post('announcements') @Roles('SCHOOL_ADMIN') createAnnouncement(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createAnnouncement(user.schoolId, dto); }
  @Delete('announcements/:id') @Roles('SCHOOL_ADMIN') deleteAnnouncement(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteAnnouncement(id, user.schoolId); }
  @Get('routes') getRoutes(@CurrentUser() user: any) { return this.academicsService.getRoutes(user.schoolId); }
  @Post('routes') @Roles('SCHOOL_ADMIN') createRoute(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createRoute(user.schoolId, dto); }
  @Delete('routes/:id') @Roles('SCHOOL_ADMIN') deleteRoute(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteRoute(id, user.schoolId); }
  @Get('vehicles') getVehicles(@CurrentUser() user: any) { return this.academicsService.getVehicles(user.schoolId); }
  @Post('vehicles') @Roles('SCHOOL_ADMIN') createVehicle(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createVehicle(user.schoolId, dto); }
  @Delete('vehicles/:id') @Roles('SCHOOL_ADMIN') deleteVehicle(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteVehicle(id, user.schoolId); }
}
