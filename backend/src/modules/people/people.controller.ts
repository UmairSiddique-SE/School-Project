import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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
    if (user?.role === 'PARENT') {
      const account = await this.prisma.user.findFirst({
        where: { id: user.id, schoolId: user.schoolId, role: 'PARENT', isActive: true, deletedAt: null },
        select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, schoolId: true },
      });
      if (!account) return null;
      const parent = await this.prisma.parent.findFirst({
        where: { userId: account.id, schoolId: user.schoolId, deletedAt: null },
        include: {
          students: {
            include: {
              student: {
                include: {
                  section: { include: { class: true } },
                  attendances: { orderBy: { date: 'desc' }, take: 100 },
                  examResults: {
                    where: { exam: { isPublished: true, deletedAt: null } },
                    include: { exam: true, subject: true },
                    orderBy: { id: 'desc' },
                    take: 100,
                  },
                  feePayments: { take: 50 },
                  homeworkSubmissions: { include: { homework: true }, orderBy: { id: 'desc' }, take: 50 },
                },
              },
            },
          },
        },
      });
      return parent ? { ...parent, account } : { account, students: [] };
    }

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
  getStats(@CurrentUser() user: any) {
    return this.peopleService.getSchoolStats(user.schoolId);
  }

  @Get('student-facilities')
  @Roles('SCHOOL_ADMIN')
  async getStudentFacilities(@CurrentUser() user: any) {
    const [transportRoutes, hostels] = await Promise.all([
      this.prisma.transportRoute.count({ where: { schoolId: user.schoolId, isActive: true } }),
      this.prisma.hostel.count({ where: { schoolId: user.schoolId, isActive: true } }),
    ]);
    return { transport: transportRoutes > 0, hostel: hostels > 0 };
  }

  @Get('teachers')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getTeachers(@CurrentUser() user: any) {
    return this.peopleService.getTeachers(
      user.schoolId,
      user.role === 'TEACHER' ? user.email : undefined,
    );
  }

  @Post('teachers')
  @Roles('SCHOOL_ADMIN')
  async createTeacher(@CurrentUser() user: any, @Body() dto: any) {
    await this.planLimitService.assertStaffCapacity(user.schoolId);
    return this.peopleService.createTeacher(user.schoolId, dto);
  }

  @Post('teachers/:id/change-password')
  @Patch('teachers/:id/change-password')
  @Patch('teachers/:id/password')
  @Roles('SCHOOL_ADMIN')
  async updateTeacherPassword(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    if (!id?.trim()) throw new BadRequestException('Teacher ID is required');
    if (!dto?.password || String(dto.password).trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    return this.peopleService.updateTeacherPassword(id, user.schoolId, String(dto.password).trim());
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

  @Post('teachers/:id/pay-salary')
  @Roles('SCHOOL_ADMIN')
  payTeacherSalary(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.peopleService.payTeacherSalary(id, user.schoolId, dto);
  }

  @Post('teachers/:id/assign-section')
  @Roles('SCHOOL_ADMIN')
  assignTeacherSection(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    if (!dto?.sectionId) throw new BadRequestException('Section ID is required');
    return this.peopleService.assignTeacherSection(id, user.schoolId, dto.sectionId);
  }

  @Delete('teachers/sections/:sectionId')
  @Roles('SCHOOL_ADMIN')
  unassignTeacherSection(@CurrentUser() user: any, @Param('sectionId') sectionId: string) {
    return this.peopleService.unassignTeacherSection(sectionId, user.schoolId);
  }

  @Post('teachers/:id/assign-subject')
  @Roles('SCHOOL_ADMIN')
  assignTeacherSubject(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    if (!dto?.classId || !dto?.subjectId) throw new BadRequestException('Class ID and Subject ID are required');
    return this.peopleService.assignTeacherSubject(id, user.schoolId, dto);
  }

  @Delete('teachers/subjects/:classSubjectId')
  @Roles('SCHOOL_ADMIN')
  unassignTeacherSubject(@CurrentUser() user: any, @Param('classSubjectId') classSubjectId: string) {
    return this.peopleService.unassignTeacherSubject(classSubjectId, user.schoolId);
  }

  @Get('students')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  async getStudents(@CurrentUser() user: any) {
    if (user?.role === 'SCHOOL_ADMIN') return this.peopleService.getStudents(user.schoolId);

    const teacher = await this.prisma.teacher.findFirst({
      where: { schoolId: user.schoolId, email: user.email, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!teacher) return [];

    const sections = await this.prisma.section.findMany({
      where: {
        class: { schoolId: user.schoolId, deletedAt: null },
        deletedAt: null,
        OR: [
          { teacherId: teacher.id },
          { class: { subjects: { some: { teacherId: teacher.id, teacher: { isActive: true, deletedAt: null } } } } },
        ],
      },
      select: { id: true },
    });
    const sectionIds = sections.map(section => section.id);
    if (!sectionIds.length) return [];

    return this.prisma.student.findMany({
      where: { schoolId: user.schoolId, sectionId: { in: sectionIds }, deletedAt: null },
      include: { section: { include: { class: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Post('students')
  @Roles('SCHOOL_ADMIN')
  async createStudent(@CurrentUser() user: any, @Body() dto: any) {
    this.validateStudentPayload(dto, true);
    await this.planLimitService.assertStudentCapacity(user.schoolId);
    await this.assertSectionCapacity(user.schoolId, dto.sectionId);

    if (dto.bFormNumber) {
      const duplicate = await this.prisma.student.findFirst({
        where: { schoolId: user.schoolId, bFormNumber: dto.bFormNumber, deletedAt: null },
        select: { id: true },
      });
      if (duplicate) throw new BadRequestException('A student with this B-Form / CNIC already exists');
    }

    return this.peopleService.createStudent(user.schoolId, dto);
  }

  @Post('students/:id/change-password')
  @Patch('students/:id/change-password')
  @Patch('students/:id/password')
  @Roles('SCHOOL_ADMIN')
  async updateStudentPassword(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    if (!id?.trim()) throw new BadRequestException('Student ID is required');
    if (!dto?.password || String(dto.password).trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    return this.peopleService.updateStudentPassword(id, user.schoolId, String(dto.password).trim());
  }

  @Patch('students/:id')
  @Roles('SCHOOL_ADMIN')
  async updateStudent(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    if (!id?.trim()) throw new BadRequestException('Student ID is required');
    this.validateStudentPayload(dto, false);
    if (dto.admissionNo !== undefined) throw new BadRequestException('Admission No cannot be changed after admission');
    if (dto.email !== undefined) throw new BadRequestException('Student login email cannot be changed after admission');

    const current = await this.prisma.student.findFirst({
      where: { id, schoolId: user.schoolId, deletedAt: null },
      select: { sectionId: true },
    });
    if (!current) throw new BadRequestException('Student not found');

    if (dto.bFormNumber) {
      const duplicate = await this.prisma.student.findFirst({
        where: { schoolId: user.schoolId, bFormNumber: dto.bFormNumber, deletedAt: null, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new BadRequestException('A student with this B-Form / CNIC already exists');
    }

    if (dto.sectionId && current.sectionId !== dto.sectionId) {
      await this.assertSectionCapacity(user.schoolId, dto.sectionId);
    }
    return this.peopleService.updateStudent(id, user.schoolId, dto);
  }

  @Delete('students/:id')
  @Roles('SCHOOL_ADMIN')
  async deleteStudent(@CurrentUser() user: any, @Param('id') id: string) {
    if (!id?.trim()) throw new BadRequestException('Student ID is required');
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId: user.schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!student) throw new BadRequestException('Student not found or already archived');
    return this.peopleService.deleteStudent(id, user.schoolId);
  }

  @Post('students/promote')
  @Roles('SCHOOL_ADMIN')
  async promoteStudents(@CurrentUser() user: any, @Body() dto: any) {
    const ids = Array.isArray(dto?.studentIds) ? dto.studentIds.filter(Boolean) : [];
    if (!ids.length) throw new BadRequestException('At least one student must be selected');
    if (!dto?.sectionId) throw new BadRequestException('Target section is required');

    const target = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, deletedAt: null, class: { schoolId: user.schoolId, deletedAt: null } },
      select: { id: true, capacity: true, classId: true },
    });
    if (!target) throw new BadRequestException('Target section does not belong to this school');

    const students = await this.prisma.student.findMany({
      where: { id: { in: ids }, schoolId: user.schoolId, deletedAt: null },
      select: { id: true, sectionId: true },
    });
    if (students.length !== ids.length) throw new BadRequestException('One or more selected students do not belong to this school');

    const moving = students.filter(s => s.sectionId !== target.id).length;
    const enrolled = await this.prisma.student.count({ where: { schoolId: user.schoolId, sectionId: target.id, deletedAt: null } });
    if (enrolled + moving > target.capacity) throw new BadRequestException(`Target section capacity exceeded. Capacity is ${target.capacity}.`);

    return this.prisma.$transaction(async tx => {
      for (const student of students) {
        if (student.sectionId === target.id) continue;
        const last = await tx.student.findFirst({ where: { schoolId: user.schoolId, sectionId: target.id, deletedAt: null }, orderBy: { rollNo: 'desc' }, select: { rollNo: true } });
        const n = last?.rollNo ? parseInt(last.rollNo, 10) : 0;
        await tx.student.update({ where: { id: student.id }, data: { sectionId: target.id, rollNo: Number.isFinite(n) ? String(n + 1) : undefined, ...(dto.session ? { session: String(dto.session).trim() } : {}) } });
      }
      return { updated: students.length, sectionId: target.id, classId: target.classId };
    });
  }

  @Post('students/transfer')
  @Roles('SCHOOL_ADMIN')
  async transferStudents(@CurrentUser() user: any, @Body() dto: any) {
    const ids = Array.isArray(dto?.studentIds) ? dto.studentIds.filter(Boolean) : [];
    if (!ids.length) throw new BadRequestException('At least one student must be selected');
    if (!dto?.sectionId) throw new BadRequestException('Target section is required');

    const target = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, deletedAt: null, class: { schoolId: user.schoolId, deletedAt: null } },
      select: { id: true, capacity: true, classId: true },
    });
    if (!target) throw new BadRequestException('Target section does not belong to this school');

    const students = await this.prisma.student.findMany({ where: { id: { in: ids }, schoolId: user.schoolId, deletedAt: null }, select: { id: true, sectionId: true } });
    if (students.length !== ids.length) throw new BadRequestException('One or more selected students do not belong to this school');

    const moving = students.filter(s => s.sectionId !== target.id).length;
    const enrolled = await this.prisma.student.count({ where: { schoolId: user.schoolId, sectionId: target.id, deletedAt: null } });
    if (enrolled + moving > target.capacity) throw new BadRequestException(`Target section capacity exceeded. Capacity is ${target.capacity}.`);

    return this.prisma.$transaction(async tx => {
      for (const student of students) {
        if (student.sectionId === target.id) continue;
        const last = await tx.student.findFirst({ where: { schoolId: user.schoolId, sectionId: target.id, deletedAt: null }, orderBy: { rollNo: 'desc' }, select: { rollNo: true } });
        const n = last?.rollNo ? parseInt(last.rollNo, 10) : 0;
        await tx.student.update({ where: { id: student.id }, data: { sectionId: target.id, rollNo: Number.isFinite(n) ? String(n + 1) : undefined, ...(dto.reason ? { remarks: `Transfer: ${String(dto.reason).trim()}` } : {}) } });
      }
      return { updated: students.length, sectionId: target.id, classId: target.classId };
    });
  }

  @Get('parents')
  @Roles('SCHOOL_ADMIN')
  getParents(@CurrentUser() user: any) { return this.peopleService.getParents(user.schoolId); }

  @Post('parents')
  @Roles('SCHOOL_ADMIN')
  createParent(@CurrentUser() user: any, @Body() dto: any) { return this.peopleService.createParent(user.schoolId, dto); }

  @Delete('parents/:id')
  @Roles('SCHOOL_ADMIN')
  deleteParent(@CurrentUser() user: any, @Param('id') id: string) {
    return this.peopleService.deleteParent(id, user.schoolId);
  }

  @Get('staff')
  @Roles('SCHOOL_ADMIN')
  getStaff(@CurrentUser() user: any) { return this.peopleService.getStaff(user.schoolId); }

  @Post('staff')
  @Roles('SCHOOL_ADMIN')
  async createStaff(@CurrentUser() user: any, @Body() dto: any) {
    await this.planLimitService.assertStaffCapacity(user.schoolId);
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

  private validateStudentPayload(dto: any, creating: boolean) {
    if (!dto || typeof dto !== 'object') throw new BadRequestException('Student data is required');
    if (creating && (!dto.name || typeof dto.name !== 'string' || dto.name.trim().length < 2 || dto.name.trim().length > 150)) {
      throw new BadRequestException('Student name is required and must contain 2-150 characters');
    }
    if (!creating && dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length < 2 || dto.name.trim().length > 150)) {
      throw new BadRequestException('Student name must contain 2-150 characters');
    }
    if (dto.sectionId !== undefined && dto.sectionId !== null && (typeof dto.sectionId !== 'string' || !dto.sectionId.trim())) {
      throw new BadRequestException('A valid section must be selected');
    }
    if (dto.email !== undefined && dto.email !== null && dto.email !== '') {
      const email = String(dto.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Please provide a valid student email address');
      dto.email = email;
    }
    if (dto.dateOfBirth !== undefined && dto.dateOfBirth !== null && dto.dateOfBirth !== '') {
      const date = new Date(dto.dateOfBirth);
      if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date of birth');
      if (date > new Date()) throw new BadRequestException('Date of birth cannot be in the future');
    }
    if (dto.bFormNumber !== undefined && dto.bFormNumber !== null && dto.bFormNumber !== '') {
      let bForm = String(dto.bFormNumber).trim().replace(/[^\d-]/g, '');
      const rawDigits = bForm.replace(/\D/g, '');
      if (rawDigits.length === 13) {
        bForm = `${rawDigits.slice(0, 5)}-${rawDigits.slice(5, 12)}-${rawDigits.slice(12)}`;
      }
      dto.bFormNumber = bForm;
    }
    if (dto.rollNo !== undefined && dto.rollNo !== null && dto.rollNo !== '') {
      const roll = String(dto.rollNo).trim();
      if (!/^\d+$/.test(roll) || Number(roll) < 1) throw new BadRequestException('Roll number must be a positive number');
      dto.rollNo = roll;
    }
    if (dto.status !== undefined && !['ACTIVE', 'INACTIVE', 'LEFT', 'GRADUATED'].includes(String(dto.status))) {
      throw new BadRequestException('Invalid student enrollment status');
    }
    if (dto.gender !== undefined && !['MALE', 'FEMALE', 'OTHER'].includes(String(dto.gender).toUpperCase())) {
      throw new BadRequestException('Invalid student gender');
    }
    if (dto.gender) dto.gender = String(dto.gender).toUpperCase();
    if (dto.session !== undefined && dto.session !== null && dto.session !== '' && !/^\d{4}-\d{4}$/.test(String(dto.session))) {
      throw new BadRequestException('Session must use YYYY-YYYY format (e.g. 2026-2027)');
    }
    if (dto.admissionType !== undefined && dto.admissionType !== null && dto.admissionType !== '') {
      const at = String(dto.admissionType).toUpperCase();
      dto.admissionType = ['NEW', 'TRANSFER'].includes(at) ? at : 'NEW';
    }
    const phoneFields = ['phone', 'studentMobile', 'fatherMobile1', 'fatherMobile2', 'fatherWhatsapp', 'motherMobile', 'guardianMobile'];
    for (const field of phoneFields) {
      if (dto[field] !== undefined && dto[field] !== null && dto[field] !== '') {
        let phone = String(dto[field]).trim().replace(/[^\d-]/g, '');
        const raw = phone.replace(/\D/g, '');
        if (raw.length === 11) {
          phone = `${raw.slice(0, 4)}-${raw.slice(4)}`;
        }
        dto[field] = phone;
      }
    }
    const cnicFields = ['fatherCnic', 'motherCnic', 'guardianCnic'];
    for (const field of cnicFields) {
      if (dto[field] !== undefined && dto[field] !== null && dto[field] !== '') {
        let cnic = String(dto[field]).trim().replace(/[^\d-]/g, '');
        const raw = cnic.replace(/\D/g, '');
        if (raw.length === 13) {
          cnic = `${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12)}`;
        }
        dto[field] = cnic;
      }
    }
    if (dto.fatherStatus !== undefined && dto.fatherStatus !== null && dto.fatherStatus !== '') {
      const fs = String(dto.fatherStatus).toUpperCase();
      dto.fatherStatus = ['ALIVE', 'DECEASED'].includes(fs) ? fs : 'ALIVE';
    }
    if (dto.guardianRelation !== undefined && dto.guardianRelation !== null && dto.guardianRelation !== '') {
      const gr = String(dto.guardianRelation).toUpperCase();
      dto.guardianRelation = ['UNCLE', 'AUNT', 'GRANDPARENT', 'SIBLING', 'OTHER'].includes(gr) ? gr : 'OTHER';
    }
  }

  private async assertSectionCapacity(schoolId: string, sectionId?: string) {
    if (!sectionId) return;
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, deletedAt: null, class: { schoolId, deletedAt: null } },
      select: { id: true, capacity: true },
    });
    if (!section) throw new BadRequestException('Selected section does not belong to this school');

    const enrolled = await this.prisma.student.count({ where: { schoolId, sectionId, deletedAt: null } });
    if (enrolled >= section.capacity) throw new BadRequestException(`Section capacity reached. This section allows ${section.capacity} active students.`);
  }
}
