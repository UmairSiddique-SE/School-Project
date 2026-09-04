import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.classService.findAll(user.schoolId, user.role, user.email);
  }

  @Post()
  @Roles('SCHOOL_ADMIN')
  createClass(@CurrentUser() user: any, @Body() dto: any) {
    return this.classService.createClass(user.schoolId, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN')
  deleteClass(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classService.deleteClass(id, user.schoolId);
  }

  @Post('sections')
  @Roles('SCHOOL_ADMIN')
  createSection(@CurrentUser() user: any, @Body() dto: any) {
    return this.classService.createSection(user.schoolId, dto);
  }

  @Delete('sections/:id')
  @Roles('SCHOOL_ADMIN')
  deleteSection(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classService.deleteSection(id, user.schoolId);
  }

  @Get('subjects')
  getSubjects(@CurrentUser() user: any) {
    return this.classService.getSubjects(user.schoolId);
  }

  @Post('subjects')
  @Roles('SCHOOL_ADMIN')
  createSubject(@CurrentUser() user: any, @Body() dto: any) {
    return this.classService.createSubject(user.schoolId, dto);
  }

  @Post('subjects/assign')
  @Roles('SCHOOL_ADMIN')
  assignSubjectTeacher(@CurrentUser() user: any, @Body() dto: any) {
    return this.classService.assignSubjectTeacher(user.schoolId, dto);
  }

  @Delete('subjects/assign/:id')
  @Roles('SCHOOL_ADMIN')
  removeSubjectTeacher(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classService.removeSubjectTeacher(id, user.schoolId);
  }
}