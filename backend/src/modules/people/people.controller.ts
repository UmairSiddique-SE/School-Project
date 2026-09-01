import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.peopleService.getSchoolStats(user.schoolId);
  }

  // Teachers
  @Get('teachers')
  getTeachers(@CurrentUser() user: any) {
    return this.peopleService.getTeachers(user.schoolId);
  }

  @Post('teachers')
  createTeacher(@CurrentUser() user: any, @Body() dto: any) {
    return this.peopleService.createTeacher(user.schoolId, dto);
  }

  @Patch('teachers/:id')
  updateTeacher(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.peopleService.updateTeacher(id, user.schoolId, dto);
  }

  @Delete('teachers/:id')
  deleteTeacher(@CurrentUser() user: any, @Param('id') id: string) {
    return this.peopleService.deleteTeacher(id, user.schoolId);
  }

  // Students
  @Get('students')
  getStudents(@CurrentUser() user: any) {
    return this.peopleService.getStudents(user.schoolId);
  }

  @Post('students')
  createStudent(@CurrentUser() user: any, @Body() dto: any) {
    return this.peopleService.createStudent(user.schoolId, dto);
  }

  @Patch('students/:id')
  updateStudent(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.peopleService.updateStudent(id, user.schoolId, dto);
  }

  @Delete('students/:id')
  deleteStudent(@CurrentUser() user: any, @Param('id') id: string) {
    return this.peopleService.deleteStudent(id, user.schoolId);
  }

  // Parents
  @Get('parents')
  getParents(@CurrentUser() user: any) {
    return this.peopleService.getParents(user.schoolId);
  }

  @Post('parents')
  createParent(@CurrentUser() user: any, @Body() dto: any) {
    return this.peopleService.createParent(user.schoolId, dto);
  }

  // Staff
  @Get('staff')
  getStaff(@CurrentUser() user: any) {
    return this.peopleService.getStaff(user.schoolId);
  }

  @Post('staff')
  createStaff(@CurrentUser() user: any, @Body() dto: any) {
    return this.peopleService.createStaff(user.schoolId, dto);
  }

  @Delete('staff/:id')
  deleteStaff(@CurrentUser() user: any, @Param('id') id: string) {
    return this.peopleService.deleteStaff(id, user.schoolId);
  }
}

