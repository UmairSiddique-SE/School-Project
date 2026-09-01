import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (data.classId) {
      const schoolClass = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId, deletedAt: null } });
      if (!schoolClass) throw new NotFoundException('Class not found');
    }
    return this.prisma.feeStructure.create({
      data: {
        name: data.name,
        amount: parseFloat(data.amount),
        frequency: data.frequency || 'MONTHLY',
        description: data.description || null,
        classId: data.classId || null,
        schoolId,
      },
    });
  }

  async getPayments(schoolId: string) {
    return this.prisma.feePayment.findMany({
      where: { schoolId },
      include: {
        student: { select: { name: true, admissionNo: true } },
        feeStructure: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async collectFee(schoolId: string, data: any) {
    const student = await this.prisma.student.findFirst({
      where: { id: data.studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (data.feeStructureId) {
      const structure = await this.prisma.feeStructure.findFirst({ where: { id: data.feeStructureId, schoolId } });
      if (!structure) throw new NotFoundException('Fee structure not found');
    }

    const totalPaid = parseFloat(data.amountPaid);
    const amount = parseFloat(data.amountDue);
    const discount = data.discount ? parseFloat(data.discount) : 0;
    const fine = data.fine ? parseFloat(data.fine) : 0;

    let status = 'PENDING';
    if (totalPaid >= (amount - discount + fine)) {
      status = 'PAID';
    } else if (totalPaid > 0) {
      status = 'PARTIAL';
    }

    return this.prisma.feePayment.create({
      data: {
        amount,
        discount,
        fine,
        totalPaid,
        method: data.method || 'CASH',
        status: status as any,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paidDate: new Date(),
        remarks: data.remarks || null,
        schoolId,
        studentId: data.studentId,
        feeStructureId: data.feeStructureId || null,
      },
    });
  }
}
