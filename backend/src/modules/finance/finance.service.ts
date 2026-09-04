import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeeStructures(schoolId: string) {
    return this.prisma.feeStructure.findMany({
      where: { schoolId },
      include: { class: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFeeStructure(schoolId: string, data: any) {
    const name = String(data?.name || '').trim();
    const amount = Number(data?.amount);
    if (!name) throw new BadRequestException('Fee structure name is required');
    if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException('Fee amount must be a valid non-negative number');

    if (data.classId) {
      const schoolClass = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId, deletedAt: null } });
      if (!schoolClass) throw new NotFoundException('Class not found');
    }
    return this.prisma.feeStructure.create({
      data: {
        name,
        amount,
        frequency: data.frequency || 'MONTHLY',
        description: data.description?.trim() || null,
        classId: data.classId || null,
        schoolId,
      },
    });
  }

  async getPaymentsForUser(user: any) {
    if (user?.role === 'SCHOOL_ADMIN') return this.getPayments(user.schoolId);

    const studentIds: string[] = [];
    if (user?.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({ where: { schoolId: user.schoolId, email: user.email, deletedAt: null }, select: { id: true } });
      if (student) studentIds.push(student.id);
    } else if (user?.role === 'PARENT') {
      const parent = await this.prisma.parent.findFirst({ where: { schoolId: user.schoolId, email: user.email, deletedAt: null }, select: { id: true } });
      if (parent) {
        const links = await this.prisma.studentParent.findMany({
          where: { parentId: parent.id, student: { schoolId: user.schoolId, deletedAt: null } },
          select: { studentId: true },
        });
        studentIds.push(...links.map(link => link.studentId));
      }
    }

    if (!studentIds.length) return [];
    return this.prisma.feePayment.findMany({
      where: { schoolId: user.schoolId, studentId: { in: [...new Set(studentIds)] } },
      include: { student: { select: { name: true, admissionNo: true } }, feeStructure: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayments(schoolId: string) {
    return this.prisma.feePayment.findMany({
      where: { schoolId },
      include: { student: { select: { name: true, admissionNo: true } }, feeStructure: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async collectFee(schoolId: string, data: any) {
    const student = await this.prisma.student.findFirst({ where: { id: data?.studentId, schoolId, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');

    let structure: any = null;
    if (data?.feeStructureId) {
      structure = await this.prisma.feeStructure.findFirst({ where: { id: data.feeStructureId, schoolId } });
      if (!structure) throw new NotFoundException('Fee structure not found');
    }

    const amount = Number(data?.amountDue);
    const totalPaid = Number(data?.amountPaid);
    const discount = data?.discount === undefined || data?.discount === '' ? 0 : Number(data.discount);
    const fine = data?.fine === undefined || data?.fine === '' ? 0 : Number(data.fine);
    if (![amount, totalPaid, discount, fine].every(Number.isFinite)) {
      throw new BadRequestException('Fee amounts must be valid numbers');
    }
    if (amount < 0 || totalPaid < 0 || discount < 0 || fine < 0) {
      throw new BadRequestException('Fee amounts cannot be negative');
    }
    if (discount > amount) throw new BadRequestException('Discount cannot exceed the amount due');
    if (totalPaid > amount - discount + fine) throw new BadRequestException('Amount paid cannot exceed the final payable amount');

    const payable = amount - discount + fine;
    let status = 'PENDING';
    if (totalPaid >= payable) status = 'PAID';
    else if (totalPaid > 0) status = 'PARTIAL';

    let dueDate: Date | null = null;
    if (data?.dueDate) {
      dueDate = new Date(data.dueDate);
      if (Number.isNaN(dueDate.getTime())) throw new BadRequestException('Invalid due date');
    }

    return this.prisma.feePayment.create({
      data: {
        amount,
        discount,
        fine,
        totalPaid,
        method: data?.method || 'CASH',
        status: status as any,
        dueDate,
        paidDate: totalPaid > 0 ? new Date() : null,
        remarks: data?.remarks?.trim() || null,
        schoolId,
        studentId: student.id,
        feeStructureId: structure?.id || null,
      },
    });
  }
}
