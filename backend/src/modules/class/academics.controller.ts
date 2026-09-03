import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCHOOL_ADMIN')
@Controller('academics')
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get('homework')
  getHomework(@CurrentUser() user: any) {
    return this.academicsService.getHomework(user.schoolId);
  }

  @Post('homework')
  createHomework(@CurrentUser() user: any, @Body() dto: any) {
    return this.academicsService.createHomework(user.schoolId, user.id, dto);
  }

  @Delete('homework/:id')
  deleteHomework(@CurrentUser() user: any, @Param('id') id: string) {
    return this.academicsService.deleteHomework(id, user.schoolId);
  }

  @Get('timetables')
  getTimetables(@CurrentUser() user: any) {
    return this.academicsService.getTimetables(user.schoolId);
  }

  @Post('timetables')
  createTimetable(@CurrentUser() user: any, @Body() dto: any) {
    return this.academicsService.createTimetable(user.schoolId, dto);
  }

  @Delete('timetables/:id')
  deleteTimetable(@CurrentUser() user: any, @Param('id') id: string) {
    return this.academicsService.deleteTimetable(id, user.schoolId);
  }

  @Get('announcements')
  getAnnouncements(@CurrentUser() user: any) {
    return this.academicsService.getAnnouncements(user.schoolId);
  }

  @Post('announcements')
  createAnnouncement(@CurrentUser() user: any, @Body() dto: any) {
    return this.academicsService.createAnnouncement(user.schoolId, dto);
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@CurrentUser() user: any, @Param('id') id: string) {
    return this.academicsService.deleteAnnouncement(id, user.schoolId);
  }

  @Get('library/books')
  getBooks(@CurrentUser() user: any) {
    return this.academicsService.getBooks(user.schoolId);
  }

  @Get('library/issues')
  getBookIssues(@CurrentUser() user: any) {
    return this.academicsService.getBookIssues(user.schoolId);
  }

  @Post('library/books')
  createBook(@CurrentUser() user: any, @Body() dto: any) {
    return this.academicsService.createBook(user.schoolId, dto);
  }

  @Post('library/issues')
  issueBook(@CurrentUser() user: any, @Body() dto: any) {
    return this.academicsService.issueBook(user.schoolId, dto);
  }

  @Delete('library/books/:id')
  deleteBook(@CurrentUser() user: any, @Param('id') id: string) {
    return this.academicsService.deleteBook(id, user.schoolId);
  }

  @Get('routes')
  getRoutes(@CurrentUser() user: any) {
    return this.academicsService.getRoutes(user.schoolId);
  }

  @Post('routes')
  createRoute(@CurrentUser() user: any, @Body() dto: any) {
    return this.academicsService.createRoute(user.schoolId, dto);
  }

  @Delete('routes/:id')
  deleteRoute(@CurrentUser() user: any, @Param('id') id: string) {
    return this.academicsService.deleteRoute(id, user.schoolId);
  }

  @Get('vehicles')
  getVehicles(@CurrentUser() user: any) {
    return this.academicsService.getVehicles(user.schoolId);
  }

  @Post('vehicles')
  createVehicle(@CurrentUser() user: any, @Body() dto: any) {
    return this.academicsService.createVehicle(user.schoolId, dto);
  }

  @Delete('vehicles/:id')
  deleteVehicle(@CurrentUser() user: any, @Param('id') id: string) {
    return this.academicsService.deleteVehicle(id, user.schoolId);
  }
}
