import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeachers(schoolId: string) {
    return this.prisma.teacher.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        sectionTeacher: {
          where: { deletedAt: null },
          include: {
            class: true,
            _count: { select: { students: { where: { deletedAt: null } } } },
          },
        },
        classSubjects: {
          where: { class: { schoolId, deletedAt: null } },
          include: {
            class: true,
            subject: true,
          },
        },
        payrolls: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 6,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createTeacher(schoolId: string, data: any) {
    let employeeNo = data.employeeNo;
    if (!employeeNo || !String(employeeNo).trim()) {
      const currentYear = new Date().getFullYear();
      const lastTeacher = await this.prisma.teacher.findFirst({
        where: { schoolId, employeeNo: { startsWith: `EMP-${currentYear}` } },
        orderBy: { employeeNo: 'desc' },
      });
      let nextNum = 1;
      if (lastTeacher?.employeeNo) {
        const lastNum = parseInt(lastTeacher.employeeNo.split('-').pop() || '', 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      employeeNo = `EMP-${currentYear}-${String(nextNum).padStart(3, '0')}`;
    }

    if (!data.name || !String(data.name).trim()) throw new ConflictException('Teacher Name is required');

    const rawEmail = data.email ? String(data.email).trim().toLowerCase() : '';
    const firstName = String(data.name).trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'teacher';
    const regDigits = String(employeeNo).match(/(\d+)$/)?.[1] || String(employeeNo).replace(/\D/g, '').slice(-3) || '001';

    let email = '';
    let isCustomEmail = false;
    let customShortId = '';

    if (rawEmail) {
      if (rawEmail.includes('@')) {
        email = rawEmail;
        isCustomEmail = !rawEmail.endsWith('@school.edu');
      } else {
        customShortId = rawEmail.replace(/[^a-z0-9_-]/g, '');
        email = `${customShortId}@school.edu`;
      }
    } else {
      email = `${firstName}${regDigits}@school.edu`;
      let userExists = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
      let counter = 1;
      while (userExists) {
        email = `${firstName}${regDigits}_${counter}@school.edu`;
        userExists = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
        counter++;
      }
    }

    const existingTeacher = await this.prisma.teacher.findFirst({ where: { schoolId, deletedAt: null, OR: [{ employeeNo }, { email }] } });
    const existingStaff = await this.prisma.staff.findFirst({ where: { schoolId, deletedAt: null, OR: [{ employeeNo }, { email }] } });
    const existingUser = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (existingTeacher || existingStaff || existingUser) {
      throw new ConflictException(`A teacher or user account with Employee No "${employeeNo}" or Email/Login "${email}" already exists. Please choose a different Login ID.`);
    }
    
    let qualification = data.qualification ? String(data.qualification).trim() : 'M.Sc / M.Phil';
    if (data.specialization && String(data.specialization).trim() && !qualification.toLowerCase().includes(String(data.specialization).trim().toLowerCase())) {
      qualification = `${qualification} (${String(data.specialization).trim()})`;
    }

    const plainPassword = data.password && String(data.password).trim().length >= 6
      ? String(data.password).trim()
      : this.generate8CharPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // If there is an old deleted user with this email, delete it permanently first
        await tx.user.deleteMany({ where: { email, deletedAt: { not: null } } });

        await tx.user.create({ data: { name: data.name, email, passwordHash, role: 'TEACHER', schoolId, emailVerified: true } });
        const teacher = await tx.teacher.create({
          data: {
            employeeNo,
            name: data.name,
            email,
            phone: data.phone || null,
            gender: data.gender || 'MALE',
            qualification,
            experience: data.experience ? parseInt(data.experience, 10) : 3,
            salary: data.salary ? parseFloat(data.salary) : 45000,
            bloodGroup: data.bloodGroup || null,
            avatarUrl: data.avatarUrl || null,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            schoolId,
          },
        });
        return teacher;
      });
      return {
        teacher: result,
        credentials: {
          loginId: isCustomEmail ? email : customShortId ? customShortId : `${firstName}${regDigits}`,
          fullEmail: email,
          password: plainPassword,
        },
      };
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

    if (data.password && String(data.password).trim().length >= 6) {
      const passwordHash = await bcrypt.hash(String(data.password).trim(), 10);
      if (teacher.email) {
        await this.prisma.user.updateMany({
          where: { email: teacher.email, schoolId },
          data: { passwordHash },
        });
      }
    }

    return this.prisma.teacher.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        phone: data.phone ?? undefined,
        gender: data.gender ?? undefined,
        qualification: data.qualification ?? undefined,
        experience: data.experience !== undefined ? parseInt(data.experience, 10) : undefined,
        salary: data.salary !== undefined ? parseFloat(data.salary) : undefined,
        bloodGroup: data.bloodGroup ?? undefined,
        avatarUrl: data.avatarUrl ?? undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        isActive: data.isActive ?? undefined,
      },
    });
  }

  async updateTeacherPassword(id: string, schoolId: string, password: string) {
    if (!password || password.trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const email = teacher.email;
    const user = await this.prisma.user.findFirst({ where: { email, schoolId } });
    if (user) {
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash, emailVerified: true } });
    } else {
      await this.prisma.user.create({
        data: { name: teacher.name, email, passwordHash, role: 'TEACHER', schoolId, emailVerified: true },
      });
    }
    return { success: true, message: 'Teacher password updated successfully', loginId: email, password: password.trim() };
  }

  async deleteTeacher(id: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return this.prisma.$transaction(async (tx) => {
      await tx.teacher.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
      await tx.user.updateMany({ where: { email: teacher.email, schoolId }, data: { isActive: false, deletedAt: new Date() } });
    });
  }

  async payTeacherSalary(id: string, schoolId: string, data: any) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const month = Number(data.month) || new Date().getMonth() + 1;
    const year = Number(data.year) || new Date().getFullYear();
    const basicSalary = Number(data.basicSalary ?? teacher.salary ?? 0);
    const allowances = Number(data.allowances ?? 0);
    const deductions = Number(data.deductions ?? 0);
    const netSalary = Math.max(0, basicSalary + allowances - deductions);

    const existing = await this.prisma.payroll.findFirst({
      where: { teacherId: id, schoolId, month, year },
    });

    if (existing) {
      const updated = await this.prisma.payroll.update({
        where: { id: existing.id },
        data: {
          basicSalary,
          allowances,
          deductions,
          netSalary,
          isPaid: true,
          paidDate: new Date(),
        },
      });
      await this.prisma.accountEntry.create({
        data: {
          type: 'EXPENSE',
          category: 'SALARY',
          description: `Salary paid to ${teacher.name} (${teacher.employeeNo}) for ${month}/${year}`,
          amount: netSalary,
          date: new Date(),
          reference: `PAY-${year}-${month}-${teacher.employeeNo}`,
          schoolId,
        },
      });
      return updated;
    }

    const payroll = await this.prisma.payroll.create({
      data: {
        month,
        year,
        basicSalary,
        allowances,
        deductions,
        netSalary,
        isPaid: true,
        paidDate: new Date(),
        schoolId,
        teacherId: id,
      },
    });

    await this.prisma.accountEntry.create({
      data: {
        type: 'EXPENSE',
        category: 'SALARY',
        description: `Salary paid to ${teacher.name} (${teacher.employeeNo}) for ${month}/${year}`,
        amount: netSalary,
        date: new Date(),
        reference: `PAY-${year}-${month}-${teacher.employeeNo}`,
        schoolId,
      },
    });

    return payroll;
  }

  async assignTeacherSection(id: string, schoolId: string, sectionId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, class: { schoolId }, deletedAt: null },
    });
    if (!section) throw new NotFoundException('Section not found in this school');
    return this.prisma.section.update({
      where: { id: sectionId },
      data: { teacherId: id },
    });
  }

  async unassignTeacherSection(sectionId: string, schoolId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, class: { schoolId }, deletedAt: null },
    });
    if (!section) throw new NotFoundException('Section not found in this school');
    return this.prisma.section.update({
      where: { id: sectionId },
      data: { teacherId: null },
    });
  }

  async assignTeacherSubject(id: string, schoolId: string, data: { classId: string; subjectId: string }) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    const schoolClass = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId, deletedAt: null } });
    if (!schoolClass) throw new NotFoundException('Class not found');
    const subject = await this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Subject not found');

    const existing = await this.prisma.classSubject.findFirst({
      where: { classId: data.classId, subjectId: data.subjectId },
    });
    if (existing) {
      return this.prisma.classSubject.update({
        where: { id: existing.id },
        data: { teacherId: id },
      });
    }
    return this.prisma.classSubject.create({
      data: { classId: data.classId, subjectId: data.subjectId, teacherId: id },
    });
  }

  async unassignTeacherSubject(classSubjectId: string, schoolId: string) {
    const assignment = await this.prisma.classSubject.findFirst({
      where: { id: classSubjectId, class: { schoolId, deletedAt: null } },
    });
    if (!assignment) throw new NotFoundException('Subject assignment not found');
    return this.prisma.classSubject.update({
      where: { id: classSubjectId },
      data: { teacherId: null },
    });
  }

  async getStudents(schoolId: string) {
    return this.prisma.student.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        section: {
          include: {
            class: true,
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
        parents: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  private generate8CharPassword(): string {
    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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

    const firstName = data.name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const regDigits = admissionNo.replace(/\D/g, '');
    const lastNumSeq = parseInt(admissionNo.split('-').pop() || '', 10);
    const shortSeq = isNaN(lastNumSeq) ? regDigits.slice(-3) : String(lastNumSeq);
    const friendlyLoginId = `${firstName}${shortSeq}`; // e.g. "umair1", "ali20", "ammar100"

    const generatedPassword = (data.password && String(data.password).trim().length >= 6)
      ? String(data.password).trim()
      : '12345678';
    const passwordHash = await bcrypt.hash(generatedPassword, 10);
    const email = data.email || `${admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu`;
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException(`A user account with email "${email}" already exists. Please use a different email.`);
    try {
      const student = await this.prisma.$transaction(async (tx) => {
        await tx.user.create({ data: { name: data.name, email, passwordHash, role: 'STUDENT', schoolId, emailVerified: true } });
        const createdStudent = await tx.student.create({ data: { admissionNo, name: data.name, avatarUrl: data.avatarUrl || null, rollNo, email, phone: data.phone || data.studentMobile || null, address: data.address || data.currentAddress || null, gender: data.gender || 'MALE', dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null, bloodGroup: data.bloodGroup || null, religion: data.religion || null, sectionId: data.sectionId || null, status: data.status || 'ACTIVE', session: data.session || null, bFormNumber: data.bFormNumber || null, currentAddress: data.currentAddress || null, permanentAddress: data.permanentAddress || null, emergencyContact: data.emergencyContact || null, previousSchool: data.previousSchool || null, previousClass: data.previousClass || null, leavingCertificateUrl: data.leavingCertificateUrl || null, admissionType: data.admissionType || 'NEW', previousAcademicRecord: data.previousAcademicRecord || null, medicalNotes: data.medicalNotes || null, specialRequirements: data.specialRequirements || null, transportRequired: data.transportRequired === true || data.transportRequired === 'true', hostelRequired: data.hostelRequired === true || data.hostelRequired === 'true', remarks: data.remarks || null, schoolId } });
        if (data.fatherName || data.motherName || data.guardianName) {
          const parentName = data.fatherName || data.guardianName || data.motherName || 'Parent of ' + data.name;
          const parentEmail = data.parentEmail || `${admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}_parent@school.edu`;
          const rawParentPass = data.parentPassword && data.parentPassword.length >= 6 ? data.parentPassword : '12345678';
          const parentPasswordHash = await bcrypt.hash(rawParentPass, 10);
          let parentUser = await tx.user.findUnique({ where: { email: parentEmail } });
          if (!parentUser) parentUser = await tx.user.create({ data: { name: parentName, email: parentEmail, passwordHash: parentPasswordHash, role: 'PARENT', schoolId } });
          else if (parentUser.schoolId !== schoolId) throw new ConflictException('Parent account belongs to another school');
          const parent = await tx.parent.create({ data: { name: parentName, email: parentEmail, phone: data.fatherMobile1 || data.guardianMobile || data.motherMobile || '0000000000', relation: data.fatherName ? 'FATHER' : data.guardianName ? 'GUARDIAN' : 'MOTHER', fatherName: data.fatherName || null, fatherMobile1: data.fatherMobile1 || null, fatherMobile2: data.fatherMobile2 || null, fatherWhatsapp: data.fatherWhatsapp || null, fatherCnic: data.fatherCnic || null, fatherOccupation: data.fatherOccupation || null, fatherStatus: data.fatherStatus || 'ALIVE', motherName: data.motherName || null, motherMobile: data.motherMobile || null, motherCnic: data.motherCnic || null, motherOccupation: data.motherOccupation || null, guardianName: data.guardianName || null, guardianRelation: data.guardianRelation || null, guardianMobile: data.guardianMobile || null, addressCountry: data.addressCountry || data.country || null, addressProvince: data.addressProvince || data.province || null, addressCity: data.addressCity || data.district || null, addressLine: data.addressLine || data.currentAddress || data.address || null, schoolId, userId: parentUser.id } });
          await tx.studentParent.create({ data: { studentId: createdStudent.id, parentId: parent.id, isPrimary: true } });
        }
        return createdStudent;
      });
      return {
        student,
        credentials: {
          loginId: friendlyLoginId,
          admissionNo,
          fullEmail: email,
          password: generatedPassword,
        },
      };
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
    const updatedStudent = await this.prisma.student.update({ where: { id }, data: { name: data.name ?? undefined, avatarUrl: data.avatarUrl ?? undefined, rollNo: data.rollNo ?? undefined, phone: data.phone ?? undefined, address: data.address ?? data.currentAddress ?? undefined, gender: data.gender ?? undefined, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined, bloodGroup: data.bloodGroup ?? undefined, religion: data.religion ?? undefined, sectionId: data.sectionId ?? undefined, isActive: data.isActive ?? undefined, status: data.status ?? undefined, session: data.session ?? undefined, bFormNumber: data.bFormNumber ?? undefined, currentAddress: data.currentAddress ?? undefined, permanentAddress: data.permanentAddress ?? undefined, emergencyContact: data.emergencyContact ?? undefined, previousSchool: data.previousSchool ?? undefined, previousClass: data.previousClass ?? undefined, admissionType: data.admissionType ?? undefined, transportRequired: data.transportRequired !== undefined ? (data.transportRequired === true || data.transportRequired === 'true') : undefined, hostelRequired: data.hostelRequired !== undefined ? (data.hostelRequired === true || data.hostelRequired === 'true') : undefined, remarks: data.remarks ?? undefined } });
    
    // If admin updated student password
    if (data.password && String(data.password).trim().length >= 6) {
      const passwordHash = await bcrypt.hash(String(data.password).trim(), 10);
      if (student.email) {
        await this.prisma.user.updateMany({
          where: { email: student.email, schoolId },
          data: { passwordHash },
        });
      }
    }

    if (data.fatherName || data.motherName || data.guardianName || data.fatherMobile1 || data.motherMobile || data.fatherWhatsapp || data.fatherStatus) {
      const studentParent = await this.prisma.studentParent.findFirst({ where: { studentId: id, isPrimary: true, parent: { schoolId } } });
      if (studentParent) await this.prisma.parent.update({ where: { id: studentParent.parentId }, data: { fatherName: data.fatherName ?? undefined, fatherMobile1: data.fatherMobile1 ?? undefined, fatherMobile2: data.fatherMobile2 ?? undefined, fatherWhatsapp: data.fatherWhatsapp ?? undefined, fatherCnic: data.fatherCnic ?? undefined, fatherOccupation: data.fatherOccupation ?? undefined, fatherStatus: data.fatherStatus ?? undefined, motherName: data.motherName ?? undefined, motherMobile: data.motherMobile ?? undefined, motherCnic: data.motherCnic ?? undefined, motherOccupation: data.motherOccupation ?? undefined, guardianName: data.guardianName ?? undefined, guardianRelation: data.guardianRelation ?? undefined, guardianMobile: data.guardianMobile ?? undefined, addressLine: data.currentAddress ?? data.address ?? undefined } });
    }
    return updatedStudent;
  }

  async updateStudentPassword(id: string, schoolId: string, password: string) {
    if (!password || password.trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const student = await this.prisma.student.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');
    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const email = student.email || `${student.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu`;
    const user = await this.prisma.user.findFirst({ where: { email, schoolId } });
    if (user) {
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash, emailVerified: true } });
    } else {
      await this.prisma.user.create({
        data: { name: student.name, email, passwordHash, role: 'STUDENT', schoolId, emailVerified: true },
      });
    }
    return { success: true, message: 'Student password updated successfully', loginId: email, password: password.trim() };
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
    const teacherRows = teachers.map((t) => ({ id: t.id, employeeNo: t.employeeNo, name: t.name, email: t.email, phone: t.phone, gender: t.gender, designation: 'Teacher', qualification: t.qualification, experience: t.experience, salary: t.salary, isActive: t.isActive, deletedAt: t.deletedAt }));
    return [...staffMembers, ...teacherRows];
  }
}
