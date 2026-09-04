import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeachers(schoolId: string) {
    return this.prisma.teacher.findMany({ where: { schoolId, deletedAt: null }, orderBy: { name: 'asc' } });
  }

  async createTeacher(schoolId: string, data: any) {
    if (!data.employeeNo || !data.name || !data.email) throw new ConflictException('Employee No, Name, and Email are required');
    const existingTeacher = await this.prisma.teacher.findFirst({ where: { schoolId, OR: [{ employeeNo: data.employeeNo }, { email: data.email }] } });
    const existingStaff = await this.prisma.staff.findFirst({ where: { schoolId, OR: [{ employeeNo: data.employeeNo }, { email: data.email }] } });
    if (existingTeacher || existingStaff) throw new ConflictException('Teacher with this Employee No or Email already exists');
    if (!data.password || data.password.length < 12) throw new BadRequestException('A password of at least 12 characters is required');
    const passwordHash = await bcrypt.hash(data.password, 12);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.user.create({ data: { name: data.name, email: data.email, passwordHash, role: 'TEACHER', schoolId } });
        return tx.teacher.create({ data: { employeeNo: data.employeeNo, name: data.name, email: data.email, phone: data.phone || null, gender: data.gender || 'MALE', qualification: data.qualification || null, experience: data.experience ? parseInt(data.experience, 10) : null, salary: data.salary ? parseFloat(data.salary) : null, schoolId } });
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException(`A record with this ${error.meta?.target?.join(', ') || 'field'} already exists.`);
      if (error?.status) throw error;
      console.error('Error creating teacher:', error);
      throw new ConflictException('Failed to create teacher. Please check the data and try again.');
    }
  }

  async updateTeacher(id: string, schoolId: string, data: any) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return this.prisma.teacher.update({ where: { id }, data: { name: data.name ?? undefined, phone: data.phone ?? undefined, gender: data.gender ?? undefined, qualification: data.qualification ?? undefined, experience: data.experience !== undefined ? parseInt(data.experience, 10) : undefined, salary: data.salary !== undefined ? parseFloat(data.salary) : undefined, isActive: data.isActive ?? undefined } });
  }

  async deleteTeacher(id: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return this.prisma.$transaction(async (tx) => {
      await tx.teacher.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
      await tx.user.updateMany({ where: { email: teacher.email, schoolId }, data: { isActive: false, deletedAt: new Date() } });
    });
  }

  async getStudents(schoolId: string) {
    return this.prisma.student.findMany({ where: { schoolId, deletedAt: null }, include: { section: { include: { class: true } } }, orderBy: { name: 'asc' } });
  }

  async createStudent(schoolId: string, data: any) {
    let admissionNo = data.admissionNo;
    if (!admissionNo) {
      const currentYear = new Date().getFullYear();
      const lastStudent = await this.prisma.student.findFirst({ where: { schoolId, admissionNo: { startsWith: `ADM-${currentYear}` } }, orderBy: { admissionNo: 'desc' } });
      let nextNum = 1;
      if (lastStudent) { const lastNum = parseInt(lastStudent.admissionNo.split('-').pop() || '', 10); if (!isNaN(lastNum)) nextNum = lastNum + 1; }
      admissionNo = `ADM-${currentYear}-${String(nextNum).padStart(4, '0')}`;
    }
    let rollNo = data.rollNo;
    if (!rollNo && data.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId } } });
      if (!section) throw new BadRequestException('Selected section does not belong to this school');
      const lastInSection = await this.prisma.student.findFirst({ where: { sectionId: data.sectionId, deletedAt: null }, orderBy: { rollNo: 'desc' } });
      let nextRoll = 1;
      if (lastInSection?.rollNo) { const lastRoll = parseInt(lastInSection.rollNo, 10); if (!isNaN(lastRoll)) nextRoll = lastRoll + 1; }
      rollNo = String(nextRoll);
    } else if (data.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId } } });
      if (!section) throw new BadRequestException('Selected section does not belong to this school');
    }
    if (!data.name) throw new ConflictException('Student name is required');
    const existing = await this.prisma.student.findUnique({ where: { admissionNo } });
    if (existing) throw new ConflictException('Student with this Admission No already exists');

    const school = await this.prisma.school.findUnique({ where: { id: schoolId }, select: { slug: true } });
    if (!school?.slug) throw new BadRequestException('School slug is not configured');
    const firstName = String(data.name).trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!firstName) throw new BadRequestException('Student name must contain letters or numbers');
    const admissionSuffix = String(admissionNo).match(/(\d+)$/)?.[1];
    if (!admissionSuffix) throw new BadRequestException('Admission No must end with a numeric value for Student Login ID generation');
    const loginId = `${firstName}${admissionSuffix}@student.${school.slug}.pk`;

    // Generate the password once during admission. Only the bcrypt hash is persisted.
    // The plaintext password is returned in this creation response so the School Admin can record it.
    const generatedPassword = randomBytes(9).toString('base64url').slice(0, 12) + '!';
    const passwordHash = await bcrypt.hash(generatedPassword, 12);
    const email = data.email || `${admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu`;
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException(`A user account with email "${email}" already exists. Please use a different email or admission number.`);
    try {
      const student = await this.prisma.$transaction(async (tx) => {
        await tx.user.create({ data: { name: data.name, email, passwordHash, role: 'STUDENT', schoolId } });
        const createdStudent = await tx.student.create({ data: { admissionNo, name: data.name, rollNo, email, phone: data.phone || data.studentMobile || null, address: data.address || null, gender: data.gender || 'MALE', dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null, bloodGroup: data.bloodGroup || null, religion: data.religion || null, sectionId: data.sectionId || null, status: data.status || 'ACTIVE', session: data.session || null, bFormNumber: data.bFormNumber || null, currentAddress: data.currentAddress || null, permanentAddress: data.permanentAddress || null, emergencyContact: data.emergencyContact || null, previousSchool: data.previousSchool || null, previousClass: data.previousClass || null, leavingCertificateUrl: data.leavingCertificateUrl || null, admissionType: data.admissionType || 'NEW', previousAcademicRecord: data.previousAcademicRecord || null, medicalNotes: data.medicalNotes || null, specialRequirements: data.specialRequirements || null, transportRequired: data.transportRequired === true || data.transportRequired === 'true', hostelRequired: data.hostelRequired === true || data.hostelRequired === 'true', remarks: data.remarks || null, schoolId } });
        if (data.fatherName || data.motherName || data.guardianName) {
          const parentName = data.fatherName || data.guardianName || data.motherName || 'Parent of ' + data.name;
          const parentEmail = data.parentEmail || `${admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}_parent@school.edu`;
          if (!data.parentPassword || data.parentPassword.length < 12) throw new BadRequestException('A parent password of at least 12 characters is required');
          const parentPasswordHash = await bcrypt.hash(data.parentPassword, 12);
          let parentUser = await tx.user.findUnique({ where: { email: parentEmail } });
          if (!parentUser) parentUser = await tx.user.create({ data: { name: parentName, email: parentEmail, passwordHash: parentPasswordHash, role: 'PARENT', schoolId } });
          else if (parentUser.schoolId !== schoolId) throw new ConflictException('Parent account belongs to another school');
          const parent = await tx.parent.create({ data: { name: parentName, email: parentEmail, phone: data.fatherMobile1 || data.guardianMobile || data.motherMobile || '0000000000', relation: data.fatherName ? 'FATHER' : data.guardianName ? 'GUARDIAN' : 'MOTHER', fatherName: data.fatherName || null, fatherMobile1: data.fatherMobile1 || null, fatherMobile2: data.fatherMobile2 || null, fatherWhatsapp: data.fatherWhatsapp || null, fatherCnic: data.fatherCnic || null, fatherOccupation: data.fatherOccupation || null, motherName: data.motherName || null, motherMobile: data.motherMobile || null, motherCnic: data.motherCnic || null, motherOccupation: data.motherOccupation || null, guardianName: data.guardianName || null, guardianRelation: data.guardianRelation || null, guardianMobile: data.guardianMobile || null, addressCountry: data.addressCountry || data.country || null, addressProvince: data.addressProvince || data.province || null, addressCity: data.addressCity || data.city || data.district || null, addressLine: data.addressLine || data.address || null, schoolId, userId: parentUser.id } });
          await tx.studentParent.create({ data: { studentId: createdStudent.id, parentId: parent.id, isPrimary: true } });
        }
        return createdStudent;
      });
      return { student, credentials: { loginId, password: generatedPassword } };
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException(`A record with this ${error.meta?.target?.join(', ') || 'field'} already exists. Please check for duplicates.`);
      if (error?.status) throw error;
      console.error('Error creating student:', error);
      throw new ConflictException('Failed to create student. Please check the data and try again.');
    }
  }

  async updateStudent(id: string, schoolId: string, data: any) {
    const student = await this.prisma.student.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');
    if (data.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId } } });
      if (!section) throw new BadRequestException('Selected section does not belong to this school');
    }
    const updatedStudent = await this.prisma.student.update({ where: { id }, data: { name: data.name ?? undefined, rollNo: data.rollNo ?? undefined, phone: data.phone ?? undefined, address: data.address ?? undefined, gender: data.gender ?? undefined, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined, bloodGroup: data.bloodGroup ?? undefined, religion: data.religion ?? undefined, sectionId: data.sectionId ?? undefined, isActive: data.isActive ?? undefined, status: data.status ?? undefined, session: data.session ?? undefined, bFormNumber: data.bFormNumber ?? undefined, currentAddress: data.currentAddress ?? undefined, permanentAddress: data.permanentAddress ?? undefined, emergencyContact: data.emergencyContact ?? undefined, previousSchool: data.previousSchool ?? undefined, previousClass: data.previousClass ?? undefined, admissionType: data.admissionType ?? undefined, transportRequired: data.transportRequired !== undefined ? (data.transportRequired === true || data.transportRequired === 'true') : undefined, hostelRequired: data.hostelRequired !== undefined ? (data.hostelRequired === true || data.hostelRequired === 'true') : undefined, remarks: data.remarks ?? undefined } });
    if (data.fatherName || data.motherName || data.guardianName || data.fatherMobile1 || data.motherMobile || data.fatherWhatsapp) {
      const studentParent = await this.prisma.studentParent.findFirst({ where: { studentId: id, isPrimary: true, parent: { schoolId } } });
      if (studentParent) await this.prisma.parent.update({ where: { id: studentParent.parentId }, data: { fatherName: data.fatherName ?? undefined, fatherMobile1: data.fatherMobile1 ?? undefined, fatherMobile2: data.fatherMobile2 ?? undefined, fatherWhatsapp: data.fatherWhatsapp ?? undefined, fatherCnic: data.fatherCnic ?? undefined, fatherOccupation: data.fatherOccupation ?? undefined, motherName: data.motherName ?? undefined, motherMobile: data.motherMobile ?? undefined, motherCnic: data.motherCnic ?? undefined, motherOccupation: data.motherOccupation ?? undefined, guardianName: data.guardianName ?? undefined, guardianMobile: data.guardianMobile ?? undefined, addressLine: data.address ?? undefined } });
    }
    return updatedStudent;
  }

  async deleteStudent(id: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({ where: { id, schoolId } });
    if (!student) throw new NotFoundException('Student not found');
    return this.prisma.$transaction(async (tx) => { await tx.student.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }); if (student.email) await tx.user.updateMany({ where: { email: student.email, schoolId }, data: { isActive: false, deletedAt: new Date() } }); });
  }

  async getParents(schoolId: string) {
    return this.prisma.parent.findMany({ where: { schoolId, deletedAt: null }, include: { students: { include: { student: true } } }, orderBy: { name: 'asc' } });
  }

  async createParent(schoolId: string, data: any) {
    const email = data.email || `${data.phone}@parent.edu`;
    if (!data.password || data.password.length < 12) throw new BadRequestException('A password of at least 12 characters is required');
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name: data.name, email, passwordHash, role: 'PARENT', schoolId } });
      const parent = await tx.parent.create({ data: { name: data.name, email, phone: data.phone, relation: data.relation || 'Parent', schoolId, userId: user.id } });
      if (data.studentId) {
        const student = await tx.student.findFirst({ where: { id: data.studentId, schoolId, deletedAt: null } });
        if (!student) throw new BadRequestException('Selected student does not belong to this school');
        await tx.studentParent.create({ data: { parentId: parent.id, studentId: student.id, isPrimary: true } });
      }
      return parent;
    });
  }

  async getStaff(schoolId: string) {
    const [staffMembers, teachers] = await Promise.all([
      this.prisma.staff.findMany({ where: { schoolId, deletedAt: null }, orderBy: { name: 'asc' } }),
      this.prisma.teacher.findMany({ where: { schoolId, deletedAt: null }, orderBy: { name: 'asc' } }),
    ]);
    const teacherRows = teachers.map((t) => ({ id: t.id, employeeNo: t.employeeNo, name: t.name, email: t.email, phone: t.phone, designation: 'Teacher', department: 'Academics', salary: t.salary, qualification: t.qualification, gender: t.gender, experience: t.experience, personType: 'teacher' as const, joiningDate: t.joiningDate, isActive: t.isActive }));
    const staffRows = staffMembers.map((s) => ({ ...s, personType: 'staff' as const }));
    return [...teacherRows, ...staffRows].sort((a, b) => a.name.localeCompare(b.name));
  }

  async createStaff(schoolId: string, data: any) {
    if (data.designation === 'Teacher') return this.createTeacher(schoolId, { ...data, password: data.password });
    const existingStaff = await this.prisma.staff.findFirst({ where: { schoolId, OR: [{ employeeNo: data.employeeNo }, { email: data.email }] } });
    const existingTeacher = await this.prisma.teacher.findFirst({ where: { schoolId, OR: [{ employeeNo: data.employeeNo }, { email: data.email }] } });
    if (existingStaff || existingTeacher) throw new ConflictException('Staff with this Employee No or Email already exists');
    if (!data.password || data.password.length < 12) throw new BadRequestException('A password of at least 12 characters is required');
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.$transaction(async (tx) => {
      await tx.user.create({ data: { name: data.name, email: data.email, passwordHash, role: 'STAFF', schoolId } });
      return tx.staff.create({ data: { employeeNo: data.employeeNo, name: data.name, email: data.email, phone: data.phone || null, designation: data.designation, department: data.department || null, salary: data.salary ? parseFloat(data.salary) : null, schoolId } });
    });
  }

  async updateStaff(id: string, schoolId: string, data: any) {
    const staff = await this.prisma.staff.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (staff) return this.prisma.$transaction(async (tx) => {
      const updated = await tx.staff.update({ where: { id }, data: { name: data.name ?? undefined, phone: data.phone ?? undefined, designation: data.designation ?? undefined, department: data.department ?? undefined, salary: data.salary !== undefined && data.salary !== '' ? parseFloat(data.salary) : undefined, isActive: data.isActive ?? undefined } });
      if (data.name || data.isActive !== undefined) await tx.user.updateMany({ where: { email: staff.email, schoolId }, data: { ...(data.name ? { name: data.name } : {}), ...(data.isActive !== undefined ? { isActive: data.isActive } : {}) } });
      return updated;
    });
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (teacher) {
      const updated = await this.updateTeacher(id, schoolId, data);
      if (data.name || data.isActive !== undefined) await this.prisma.user.updateMany({ where: { email: teacher.email, schoolId }, data: { ...(data.name ? { name: data.name } : {}), ...(data.isActive !== undefined ? { isActive: data.isActive } : {}) } });
      return updated;
    }
    throw new NotFoundException('Staff member not found');
  }
}