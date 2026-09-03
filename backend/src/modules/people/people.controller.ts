import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get('stats')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getStats(@CurrentUser() user: any) {
    return this.peopleService.getSchoolStats(user.schoolId);
  }

  // Teachers are managed by the school administration.
  @Get('teachers')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getTeachers(@CurrentUser() user: any) {
    return this.peopleService.getTeachers(user.schoolId);
  }

  @Post('teachers')
  @Roles('SCHOOL_ADMIN')
  createTeacher(@CurrentUser() user: any, @Body() dto: any) {
    return this.peopleService.createTeacher(user.schoolId, dto);
  }

  @Patch('teachers/:id')
  @Roles('SCHOOL_ADMIN')
  updateTeacher(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.peopleService.updateTeacher(id, user.schoolId, dto);
  }

  @Delete('teachers/:id')
  @Roles('SCHOOL_ADMIN')
  deleteTeacher(@CurrentUser() user: any, @Param('id') id: string) {
    return this.peopleService.deleteTeacher(id, user.schoolId);
  }

  // Students can be viewed/managed by admin and teachers; only admin mutates enrollment.
  @Get('students')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getStudents(@CurrentUser() user: any) {
    return this.peopleService.getStudents(user.schoolId);
  }

  @Post('students')
  @Roles('SCHOOL_ADMIN')
  createStudent(@CurrentUser() user: any, @Body() dto: any) {
    return this.peopleService.createStudent(user.schoolId, dto);
  }

  @Patch('students/:id')
  @Roles('SCHOOL_ADMIN')
  updateStudent(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.peopleService.updateStudent(id, user.schoolId, dto);
  }

  @Delete('students/:id')
  @Roles('SCHOOL_ADMIN')
  deleteStudent(@CurrentUser() user: any, @Param('id') id: string) {
    return this.peopleService.deleteStudent(id, user.schoolId);
  }

  // Parent directory is administrative data.
  @Get('parents')
  @Roles('SCHOOL_ADMIN')
  getParents(@CurrentUser() user: any) {
    return this.peopleService.getParents(user.schoolId);
  }

  @Post('parents')
  @Roles('SCHOOL_ADMIN')
  createParent(@CurrentUser() user: any, @Body() dto: any) {
    return this.peopleService.createParent(user.schoolId, dto);
  }

  // Teachers are represented inside the Staff module, but the backend keeps a
  // dedicated teacher profile endpoint for academic assignment workflows.
  @Get('staff')
  @Roles('SCHOOL_ADMIN')
  getStaff(@CurrentUser() user: any) {
    return this.peopleService.getStaff(user.schoolId);
  }

  @Post('staff')
  @Roles('SCHOOL_ADMIN')
  createStaff(@CurrentUser() user: any, @Body() dto: any) {
    return this.peopleService.createStaff(user.schoolId, dto);
  }

  @Patch('staff/:id')
  @Roles('SCHOOL_ADMIN')
  updateStaff(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.peopleService.updateStaff(id, user.schoolId, dto);
  }

  @Delete('staff/:id')
  @Roles('SCHOOL_ADMIN')
  deleteStaff(@CurrentUser() user: any, @Param('id') id: string) {
    return this.peopleService.deleteStaff(id, user.schoolId);
  }
}
