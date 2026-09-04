import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { PeopleService } from './people.service';
import { PlanLimitService } from './plan-limit.service';
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
    private readonly planLimitService: PlanLimitService,
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

  @Get('parent/me')
  @Roles('PARENT')
  async getParentMe(@CurrentUser() user: any) {
    const parent = await this.prisma.parent.findFirst({
      where: { schoolId: user.schoolId, email: user.email, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        students: {
          where: { student: { schoolId: user.schoolId, deletedAt: null } },
          select: {
            student: {
              select: {
                id: true,
                admissionNo: true,
                rollNo: true,
                name: true,
                gender: true,
                dob: true,
                status: true,
                section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
    });
    if (!parent) return null;
    return {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      address: parent.address,
      children: parent.students.map((link) => link.student),
    };
  }

  @Get('stats')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getStats(@CurrentUser() user: any) { return this.peopleService.getSchoolStats(user.schoolId); }

  @Get('teachers')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getTeachers(@CurrentUser() user: any) { return this.peopleService.getTeachers(user.schoolId); }

  @Post('teachers')
  @Roles('SCHOOL_ADMIN')
  async createTeacher(@CurrentUser() user: any, @Body() dto: any) {
    await this.planLimitService.assertStaffCapacity(user.schoolId);
    return this.peopleService.createTeacher(user.schoolId, dto);
  }

  @Patch('teachers/:id')
  @Roles('SCHOOL_ADMIN')
  updateTeacher(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateTeacher(id, user.schoolId, dto); }

  @Delete('teachers/:id')
  @Roles('SCHOOL_ADMIN')
  deleteTeacher(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteTeacher(id, user.schoolId); }

  @Get('students')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  async getStudents(@CurrentUser() user: any) {
    if (user?.role === 'SCHOOL_ADMIN') return this.peopleService.getStudents(user.schoolId);
    const teacher = await this.prisma.teacher.findFirst({ where: { schoolId: user.schoolId, email: user.email, deletedAt: null }, select: { id: true } });
    if (!teacher) return [];
    const sections = await this.prisma.section.findMany({ where: { class: { schoolId: user.schoolId }, teacherId: teacher.id, deletedAt: null }, select: { id: true } });
    const sectionIds = sections.map(section => section.id);
    if (!sectionIds.length) return [];
    return this.prisma.student.findMany({ where: { schoolId: user.schoolId, sectionId: { in: sectionIds }, deletedAt: null }, include: { section: { include: { class: true } } }, orderBy: { name: 'asc' } });
  }

  @Post('students')
  @Roles('SCHOOL_ADMIN')
  async createStudent(@CurrentUser() user: any, @Body() dto: any) { await this.planLimitService.assertStudentCapacity(user.schoolId); return this.peopleService.createStudent(user.schoolId, dto); }

  @Patch('students/:id')
  @Roles('SCHOOL_ADMIN')
  updateStudent(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateStudent(id, user.schoolId, dto); }

  @Delete('students/:id')
  @Roles('SCHOOL_ADMIN')
  deleteStudent(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteStudent(id, user.schoolId); }

  @Get('parents')
  @Roles('SCHOOL_ADMIN')
  getParents(@CurrentUser() user: any) { return this.peopleService.getParents(user.schoolId); }

  @Post('parents')
  @Roles('SCHOOL_ADMIN')
  createParent(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createParent(user.schoolId, dto); }

  @Get('staff')
  @Roles('SCHOOL_ADMIN')
  getStaff(@CurrentUser() user: any) { return this.peopleService.getStaff(user.schoolId); }

  @Post('staff')
  @Roles('SCHOOL_ADMIN')
  async createStaff(@CurrentUser() user: any, @Body() dto: any) { await this.planLimitService.assertStaffCapacity(user.schoolId); return this.peopleService.createStaff(user.schoolId, dto); }

  @Patch('staff/:id')
  @Roles('SCHOOL_ADMIN')
  updateStaff(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.peopleService.updateStaff(id, user.schoolId, dto); }

  @Delete('staff/:id')
  @Roles('SCHOOL_ADMIN')
  deleteStaff(@CurrentUser() user: any, @Param('id') id: string) { return this.peopleService.deleteStaff(id, user.schoolId); }
}
