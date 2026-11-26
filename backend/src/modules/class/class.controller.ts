import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards,
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
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  findAll(@CurrentUser() user: any) {
    return this.classService.findAll(user.schoolId, user.role, user.email);
  }

  @Get('sections')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  findAllSections(@CurrentUser() user: any) {
    return this.classService.findSections(user.schoolId, user.role, user.email);
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

  // ─── Subjects ───
  @Get('subjects')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  getSubjects(@CurrentUser() user: any) {
    return this.classService.getSubjects(user.schoolId, user.role, user.email);
  }

  @Post('subjects')
  @Roles('SCHOOL_ADMIN')
  createSubject(@CurrentUser() user: any, @Body() dto: any) {
    return this.classService.createSubject(user.schoolId, dto);
  }

  @Put('subjects/:id')
  @Patch('subjects/:id')
  @Roles('SCHOOL_ADMIN')
  updateSubject(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.classService.updateSubject(id, user.schoolId, dto);
  }

  @Delete('subjects/:id')
  @Roles('SCHOOL_ADMIN')
  deleteSubject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classService.deleteSubject(id, user.schoolId);
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

  @Get('teacher-mapping')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getTeacherSubjectMapping(@CurrentUser() user: any) {
    return this.classService.getTeacherSubjectMapping(user.schoolId, user);
  }

  // ─── Academic Years / Sessions ───
  @Get('academic-years')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  getAcademicYears(@CurrentUser() user: any) {
    return this.classService.getAcademicYears(user.schoolId);
  }

  @Post('academic-years')
  @Roles('SCHOOL_ADMIN')
  createAcademicYear(@CurrentUser() user: any, @Body() dto: any) {
    return this.classService.createAcademicYear(user.schoolId, dto);
  }

  @Patch('academic-years/:id')
  @Roles('SCHOOL_ADMIN')
  updateAcademicYear(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.classService.updateAcademicYear(id, user.schoolId, dto);
  }

  @Patch('academic-years/:id/set-current')
  @Roles('SCHOOL_ADMIN')
  setCurrentAcademicYear(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classService.setCurrentAcademicYear(id, user.schoolId);
  }

  @Delete('academic-years/:id')
  @Roles('SCHOOL_ADMIN')
  deleteAcademicYear(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classService.deleteAcademicYear(id, user.schoolId);
  }
}
