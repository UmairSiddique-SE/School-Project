import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academics')
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get('homework')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  getHomework(@CurrentUser() user: any) { return this.academicsService.getHomework(user.schoolId, user); }

  @Post('homework')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  createHomework(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createHomework(user.schoolId, user.role === 'TEACHER' ? user.email : null, dto); }

  @Delete('homework/:id')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  deleteHomework(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteHomework(id, user.schoolId); }

  @Get('timetables')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  getTimetables(@CurrentUser() user: any) { return this.academicsService.getTimetables(user.schoolId, user); }

  @Post('timetables')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  createTimetable(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createTimetable(user.schoolId, dto); }

  @Delete('timetables/:id')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  deleteTimetable(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteTimetable(id, user.schoolId); }

  @Get('announcements')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  getAnnouncements(@CurrentUser() user: any) { return this.academicsService.getAnnouncements(user.schoolId, user); }

  @Post('announcements')
  @Roles('SCHOOL_ADMIN')
  createAnnouncement(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createAnnouncement(user.schoolId, dto); }

  @Delete('announcements/:id')
  @Roles('SCHOOL_ADMIN')
  deleteAnnouncement(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteAnnouncement(id, user.schoolId); }

  // Library
  @Get('library/books')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  getBooks(@CurrentUser() user: any) { return this.academicsService.getBooks(user.schoolId); }

  @Post('library/books')
  @Roles('SCHOOL_ADMIN')
  createBook(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createBook(user.schoolId, dto); }

  @Delete('library/books/:id')
  @Roles('SCHOOL_ADMIN')
  deleteBook(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteBook(id, user.schoolId); }

  @Get('library/issues')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  getBookIssues(@CurrentUser() user: any) { return this.academicsService.getBookIssues(user.schoolId, user); }

  @Post('library/issues')
  @Roles('SCHOOL_ADMIN')
  issueBook(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.issueBook(user.schoolId, dto); }

  @Post('library/issues/:id/return')
  @Roles('SCHOOL_ADMIN')
  returnBook(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.academicsService.returnBook(user.schoolId, id, dto); }

  // Transport
  @Get('routes')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getRoutes(@CurrentUser() user: any) { return this.academicsService.getRoutes(user.schoolId); }

  @Post('routes')
  @Roles('SCHOOL_ADMIN')
  createRoute(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createRoute(user.schoolId, dto); }

  @Delete('routes/:id')
  @Roles('SCHOOL_ADMIN')
  deleteRoute(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteRoute(id, user.schoolId); }

  @Get('vehicles')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getVehicles(@CurrentUser() user: any) { return this.academicsService.getVehicles(user.schoolId); }

  @Post('vehicles')
  @Roles('SCHOOL_ADMIN')
  createVehicle(@CurrentUser() user: any, @Body() dto: any) { return this.academicsService.createVehicle(user.schoolId, dto); }

  @Delete('vehicles/:id')
  @Roles('SCHOOL_ADMIN')
  deleteVehicle(@CurrentUser() user: any, @Param('id') id: string) { return this.academicsService.deleteVehicle(id, user.schoolId); }
}
