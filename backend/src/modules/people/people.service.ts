import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Teachers ───────────────────────────────────────────────────────────────
  async getTeachers(schoolId: string) {
    return this.prisma.teacher.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createTeacher(schoolId: string, data: any) {
    if (!data.employeeNo || !data.name || !data.email) {
      throw new ConflictException('Employee No, Name, and Email are required');
    }

    const existingTeacher = await this.prisma.teacher.findFirst({
      where: {
        OR: [
          { employeeNo: data.employeeNo },
          { email: data.email },
        ],
      },
    });
    if (existingTeacher) throw new ConflictException('Teacher with this Employee No or Email already exists');

    const passwordHash = await bcrypt.hash(data.password || 'teacher123', 12);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create User account first
        const user = await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: 'TEACHER',
            schoolId,
          },
        });

        // Create Teacher profile
        return tx.teacher.create({
          data: {
            employeeNo: data.employeeNo,
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            gender: data.gender || 'MALE',
            qualification: data.qualification || null,
            experience: data.experience ? parseInt(data.experience, 10) : null,
            salary: data.salary ? parseFloat(data.salary) : null,
            schoolId,
          },
        });
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const field = error.meta?.target?.join(', ') || 'unknown field';
        throw new ConflictException(`A record with this ${field} already exists.`);
      }
      if (error?.status) throw error;
      console.error('Error creating teacher:', error);
      throw new ConflictException('Failed to create teacher. Please check the data and try again.');
    }
  }

  async updateTeacher(id: string, schoolId: string, data: any) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    return this.prisma.teacher.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        phone: data.phone ?? undefined,
        gender: data.gender ?? undefined,
        qualification: data.qualification ?? undefined,
        experience: data.experience !== undefined ? parseInt(data.experience, 10) : undefined,
        salary: data.salary !== undefined ? parseFloat(data.salary) : undefined,
        isActive: data.isActive ?? undefined,
      },
    });
  }

  async deleteTeacher(id: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });
      // Deactivate associated user
      await tx.user.updateMany({
        where: { email: teacher.email, schoolId },
        data: { isActive: false, deletedAt: new Date() },
      });
    });
  }

  // ─── Students ───────────────────────────────────────────────────────────────
  async getStudents(schoolId: string) {
    return this.prisma.student.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        section: {
          include: { class: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createStudent(schoolId: string, data: any) {
    // Validate required fields
    if (!data.admissionNo) {
      throw new ConflictException('Admission number is required');
    }
    if (!data.name) {
      throw new ConflictException('Student name is required');
    }

    const existing = await this.prisma.student.findUnique({ where: { admissionNo: data.admissionNo } });
    if (existing) throw new ConflictException('Student with this Admission No already exists');

    const email = data.email || `${data.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu`;
    const passwordHash = await bcrypt.hash(data.password || 'student123', 12);

    // Check if a User with this email already exists (e.g., from a previous soft-deleted record)
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException(`A user account with email "${email}" already exists. Please use a different email or admission number.`);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create User account
        await tx.user.create({
          data: {
            name: data.name,
            email,
            passwordHash,
            role: 'STUDENT',
            schoolId,
          },
        });

        const student = await tx.student.create({
          data: {
            admissionNo: data.admissionNo,
            name: data.name,
            rollNo: data.rollNo || null,
            email,
            phone: data.phone || data.studentMobile || null,
            address: data.address || null,
            gender: data.gender || 'MALE',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            bloodGroup: data.bloodGroup || null,
            religion: data.religion || null,
            sectionId: data.sectionId || null,
            schoolId,
          },
        });

        // If parent details are provided
        if (data.fatherName || data.motherName || data.guardianName) {
          const parentName = data.fatherName || data.guardianName || data.motherName || 'Parent of ' + data.name;
          const parentEmail = data.parentEmail || `${data.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}_parent@school.edu`;
          const parentPasswordHash = await bcrypt.hash(data.parentPassword || 'parent123', 12);

          // Check if Parent user exists
          let parentUser = await tx.user.findUnique({ where: { email: parentEmail } });
          if (!parentUser) {
            parentUser = await tx.user.create({
              data: {
                name: parentName,
                email: parentEmail,
                passwordHash: parentPasswordHash,
                role: 'PARENT',
                schoolId,
              },
            });
          }

          const parent = await tx.parent.create({
            data: {
              name: parentName,
              email: parentEmail,
              phone: data.fatherMobile1 || data.guardianMobile || data.motherMobile || '0000000000',
              relation: data.fatherName ? 'FATHER' : data.guardianName ? 'GUARDIAN' : 'MOTHER',
              fatherName: data.fatherName || null,
              fatherMobile1: data.fatherMobile1 || null,
              fatherMobile2: data.fatherMobile2 || null,
              fatherCnic: data.fatherCnic || null,
              fatherOccupation: data.fatherOccupation || null,
              motherName: data.motherName || null,
              motherMobile: data.motherMobile || null,
              guardianName: data.guardianName || null,
              guardianRelation: data.guardianRelation || null,
              guardianMobile: data.guardianMobile || null,
              addressCountry: data.addressCountry || data.country || null,
              addressProvince: data.addressProvince || data.province || null,
              addressCity: data.addressCity || data.city || data.district || null,
              addressLine: data.addressLine || data.address || null,
              schoolId,
              userId: parentUser.id,
            },
          });

          await tx.studentParent.create({
            data: {
              studentId: student.id,
              parentId: parent.id,
              isPrimary: true,
            },
          });
        }

        return student;
      });
    } catch (error: any) {
      // Handle Prisma unique constraint violations gracefully
      if (error?.code === 'P2002') {
        const field = error.meta?.target?.join(', ') || 'unknown field';
        throw new ConflictException(`A record with this ${field} already exists. Please check for duplicates.`);
      }
      // Re-throw known NestJS exceptions as-is
      if (error?.status) {
        throw error;
      }
      // Log unknown errors and throw a generic message
      console.error('Error creating student:', error);
      throw new ConflictException('Failed to create student. Please check the data and try again.');
    }
  }

  async updateStudent(id: string, schoolId: string, data: any) {
    const student = await this.prisma.student.findFirst({ where: { id, schoolId, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.student.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        rollNo: data.rollNo ?? undefined,
        phone: data.phone ?? undefined,
        address: data.address ?? undefined,
        gender: data.gender ?? undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        bloodGroup: data.bloodGroup ?? undefined,
        religion: data.religion ?? undefined,
        sectionId: data.sectionId ?? undefined,
        isActive: data.isActive ?? undefined,
      },
    });
  }

  async deleteStudent(id: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({ where: { id, schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });
      if (student.email) {
        await tx.user.updateMany({
          where: { email: student.email, schoolId },
          data: { isActive: false, deletedAt: new Date() },
        });
      }
    });
  }

  // ─── Parents ────────────────────────────────────────────────────────────────
  async getParents(schoolId: string) {
    return this.prisma.parent.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        students: {
          include: { student: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createParent(schoolId: string, data: any) {
    const email = data.email || `${data.phone}@parent.edu`;
    const passwordHash = await bcrypt.hash(data.password || 'parent123', 12);

    return this.prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          name: data.name,
          email,
          passwordHash,
          role: 'PARENT',
          schoolId,
        },
      });

      const parent = await tx.parent.create({
        data: {
          name: data.name,
          email,
          phone: data.phone,
          relation: data.relation || 'Parent',
          schoolId,
          userId: user.id,
        },
      });

      if (data.studentId) {
        await tx.studentParent.create({
          data: {
            parentId: parent.id,
            studentId: data.studentId,
            isPrimary: true,
          },
        });
      }

      return parent;
    });
  }

  // ─── Staff ──────────────────────────────────────────────────────────────────
  async getStaff(schoolId: string) {
    return this.prisma.staff.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createStaff(schoolId: string, data: any) {
    const existing = await this.prisma.staff.findFirst({
      where: {
        OR: [
          { employeeNo: data.employeeNo },
          { email: data.email },
        ],
      },
    });
    if (existing) throw new ConflictException('Staff with this Employee No or Email already exists');

    const passwordHash = await bcrypt.hash(data.password || 'staff123', 12);

    return this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'STAFF',
          schoolId,
        },
      });

      return tx.staff.create({
        data: {
          employeeNo: data.employeeNo,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          designation: data.designation,
          department: data.department || null,
          salary: data.salary ? parseFloat(data.salary) : null,
          schoolId,
        },
      });
    });
  }

  async deleteStaff(id: string, schoolId: string) {
    const staff = await this.prisma.staff.findFirst({ where: { id, schoolId } });
    if (!staff) throw new NotFoundException('Staff not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.staff.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });
      await tx.user.updateMany({
        where: { email: staff.email, schoolId },
        data: { isActive: false, deletedAt: new Date() },
      });
    });
  }

  // ─── Dashboard Stats ────────────────────────────────────────────────────────
  async getSchoolStats(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      studentsCount,
      teachersCount,
      parentsCount,
      staffCount,
      classesCount,
      pendingHomeworks,
      pendingLeaves,
      overdueLibraryBooks,
      attendances,
      feePayments,
      announcements,
      recentAdmissions,
      upcomingExams
    ] = await Promise.all([
      this.prisma.student.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.teacher.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.parent.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.staff.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.class.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.homework.count({ where: { schoolId, dueDate: { gte: new Date() } } }),
      this.prisma.leaveRequest.count({ where: { schoolId, status: 'PENDING' } }),
      this.prisma.bookIssue.count({
        where: { book: { schoolId }, returnDate: null, dueDate: { lt: new Date() } },
      }),
      this.prisma.attendance.findMany({
        where: { schoolId, date: { gte: today, lt: tomorrow }, studentId: { not: null } },
        select: { status: true },
      }),
      this.prisma.feePayment.findMany({
        where: { schoolId },
        select: { totalPaid: true, amount: true, status: true },
      }),
      this.prisma.announcement.findMany({
        where: { schoolId },
        take: 5,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.student.findMany({
        where: { schoolId, deletedAt: null },
        take: 5,
        orderBy: { admissionDate: 'desc' },
        select: { id: true, name: true, admissionDate: true, section: { select: { class: { select: { name: true } } } } }
      }),
      this.prisma.exam.findMany({
        where: { schoolId, deletedAt: null, startDate: { gte: today } },
        take: 5,
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, type: true, startDate: true }
      })
    ]);

    const totalTodayAttendance = attendances.length;
    const presentToday = attendances.filter(a => a.status === 'PRESENT').length;
    const todayAttendancePercentage = totalTodayAttendance > 0 ? Math.round((presentToday / totalTodayAttendance) * 100) : 0;

    const totalRevenue = feePayments.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
    const pendingFees = feePayments
      .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((acc, curr) => acc + (curr.amount - curr.totalPaid), 0);

    const pendingFeePaymentsCount = feePayments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE').length;

    return {
      studentsCount,
      teachersCount,
      parentsCount,
      staffCount,
      classesCount,
      todayAttendancePercentage,
      totalRevenue,
      pendingFees,
      pendingFeePaymentsCount,
      pendingHomeworks,
      pendingLeaves,
      overdueLibraryBooks,
      announcements,
      recentAdmissions,
      upcomingExams,
    };
  }
}

