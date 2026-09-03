import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { PeopleService } from './people.service';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('people')
export class PeopleController {
  constructor(
    private readonly peopleService: PeopleService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    if (user?.role !== 'STUDENT') {
      return this.prisma.user.findFirst({
        where: { id: user.id, schoolId: user.schoolId, isActive: true, deletedAt: null },
        select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, schoolId: true },
      });
    }
    const account = await this.prisma.user.findFirst({
      where: { id: user.id, schoolId: user.schoolId, role: 'STUDENT', isActive: true, deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!account) return null;
    const student = await this.prisma.student.findFirst({
      where: { schoolId: user.schoolId, email: account.email, deletedAt: null },
      include: { section: { include: { class: true } } },
    });
    return student ? { ...student, account } : null;
  }

  @Get('stats')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getStats(@CurrentUser() user: any) { return this.peopleService.getSchoolStats(user.schoolId); }

  // Teachers are managed by the school administration.
  @Get('teachers')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getTeachers(@CurrentUser() user: any) { return this.peopleService.getTeachers(user.schoolId); }

  @Post('teachers')
  @Roles('SCHOOL_ADMIN')
  createTeacher(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createTeacher(user.schoolId, dto); }

  @Patch('teachers/:id')
  @Roles('SCHOOL_ADMIN')
  updateTeacher(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateTeacher(id, user.schoolId, dto); }

  @Delete('teachers/:id')
  @Roles('SCHOOL_ADMIN')
  deleteTeacher(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteTeacher(id, user.schoolId); }

  // Students can be viewed/managed by admin and teachers; only admin mutates enrollment.
  @Get('students')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getStudents(@CurrentUser() user: any) { return this.peopleService.getStudents(user.schoolId); }

  @Post('students')
  @Roles('SCHOOL_ADMIN')
  createStudent(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createStudent(user.schoolId, dto); }

  @Patch('students/:id')
  @Roles('SCHOOL_ADMIN')
  updateStudent(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateStudent(id, user.schoolId, dto); }

  @Delete('students/:id')
  @Roles('SCHOOL_ADMIN')
  deleteStudent(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteStudent(id, user.schoolId); }

  // Parent directory is administrative data.
  @Get('parents')
  @Roles('SCHOOL_ADMIN')
  getParents(@CurrentUser() user: any) { return this.peopleService.getParents(user.schoolId); }

  @Post('parents')
  @Roles('SCHOOL_ADMIN')
  createParent(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createParent(user.schoolId, dto); }

  // Staff is administrative data.
  @Get('staff')
  @Roles('SCHOOL_ADMIN')
  getStaff(@CurrentUser() user: any) { return this.peopleService.getStaff(user.schoolId); }

  @Post('staff')
  @Roles('SCHOOL_ADMIN')
  createStaff(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createStaff(user.schoolId, dto); }

  @Patch('staff/:id')
  @Roles('SCHOOL_ADMIN')
  updateStaff(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateStaff(id, user.schoolId, dto); }

  @Delete('staff/:id')
  @Roles('SCHOOL_ADMIN')
  deleteStaff(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteStaff(id, user.schoolId); }
}
