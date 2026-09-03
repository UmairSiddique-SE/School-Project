import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get('stats') getStats(@CurrentUser() user: any) { return this.peopleService.getSchoolStats(user.schoolId); }
  @Get('teachers') getTeachers(@CurrentUser() user: any) { return this.peopleService.getTeachers(user.schoolId); }
  @Post('teachers') @Roles('SCHOOL_ADMIN') createTeacher(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createTeacher(user.schoolId, dto); }
  @Patch('teachers/:id') @Roles('SCHOOL_ADMIN') updateTeacher(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateTeacher(id, user.schoolId, dto); }
  @Delete('teachers/:id') @Roles('SCHOOL_ADMIN') deleteTeacher(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteTeacher(id, user.schoolId); }

  @Get('students') getStudents(@CurrentUser() user: any) { return this.peopleService.getStudents(user.schoolId); }

  @Get('me')
  @Roles('STUDENT')
  async getMyStudent(@CurrentUser() user: any) {
    const students = await this.peopleService.getStudents(user.schoolId);
    const student = students.find((s: any) => s.email?.toLowerCase() === user.email?.toLowerCase());
    return student || null;
  }

  @Post('students') @Roles('SCHOOL_ADMIN') createStudent(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createStudent(user.schoolId, dto); }
  @Patch('students/:id') @Roles('SCHOOL_ADMIN') updateStudent(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateStudent(id, user.schoolId, dto); }
  @Delete('students/:id') @Roles('SCHOOL_ADMIN') deleteStudent(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteStudent(id, user.schoolId); }
  @Get('parents') getParents(@CurrentUser() user: any) { return this.peopleService.getParents(user.schoolId); }
  @Post('parents') @Roles('SCHOOL_ADMIN') createParent(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createParent(user.schoolId, dto); }
  @Get('staff') getStaff(@CurrentUser() user: any) { return this.peopleService.getStaff(user.schoolId); }
  @Post('staff') @Roles('SCHOOL_ADMIN') createStaff(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createStaff(user.schoolId, dto); }
  @Patch('staff/:id') @Roles('SCHOOL_ADMIN') updateStaff(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateStaff(id, user.schoolId, dto); }
  @Delete('staff/:id') @Roles('SCHOOL_ADMIN') deleteStaff(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteStaff(id, user.schoolId); }
}
