import { randomUUID } from 'crypto';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const FEE_FREQUENCIES = new Set(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']);
const PAYMENT_METHODS = new Set(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'ONLINE']);
const ACCOUNT_TYPES = new Set(['INCOME', 'EXPENSE']);

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeeStructures(schoolId: string, user?: any) {
    const where: any = { schoolId };
    if (user?.role !== 'SCHOOL_ADMIN') {
      where.isActive = true;
      const studentIds = await this.getStudentIdsForUser(user);
      if (!studentIds.length) return [];
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds }, schoolId, deletedAt: null },
        select: { sectionId: true },
      });
      const sectionIds = Array.from(new Set(students.map((student) => student.sectionId).filter((id): id is string => Boolean(id))));
      const sections = sectionIds.length
        ? await this.prisma.section.findMany({
            where: { id: { in: sectionIds }, class: { schoolId }, deletedAt: null },
            select: { id: true, classId: true },
          })
        : [];
      const classIds = Array.from(new Set(sections.map((section) => section.classId)));
      where.OR = [{ classId: null }, ...(classIds.length ? [{ classId: { in: classIds } }] : [])];
    }
    return this.prisma.feeStructure.findMany({
      where,
      include: { class: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFeeStructure(schoolId: string, data: any) {
    const name = String(data?.name || '').trim();
    const amount = Number(data?.amount);
    const frequency = String(data?.frequency || 'MONTHLY').trim().toUpperCase();
    if (!name) throw new BadRequestException('Fee structure name is required');
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Fee amount must be greater than zero');
    if (!FEE_FREQUENCIES.has(frequency)) throw new BadRequestException('Invalid fee frequency');
    if (data.classId) {
      const schoolClass = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId, deletedAt: null } });
      if (!schoolClass) throw new NotFoundException('Class not found in this school');
    }
    return this.prisma.feeStructure.create({
      data: { name, amount, frequency, description: data.description?.trim() || null, classId: data.classId || null, schoolId },
    });
  }

  async getPaymentsForUser(user: any) {
    if (user?.role === 'SCHOOL_ADMIN') return this.getPayments(user.schoolId);
    const studentIds = await this.getStudentIdsForUser(user);
    if (!studentIds.length) return [];
    return this.prisma.feePayment.findMany({
      where: { schoolId: user.schoolId, studentId: { in: Array.from(new Set(studentIds)) } },
      include: {
        student: { select: { id: true, name: true, admissionNo: true, section: { select: { name: true, class: { select: { name: true } } } } } },
        feeStructure: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayments(schoolId: string) {
    return this.prisma.feePayment.findMany({
      where: { schoolId },
      include: {
        student: { select: { id: true, name: true, admissionNo: true, section: { select: { name: true, class: { select: { name: true } } } } } },
        feeStructure: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async collectFee(schoolId: string, data: any) {
    const studentId = String(data?.studentId || '').trim();
    const student = await this.prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null }, select: { id: true, sectionId: true } });
    if (!student) throw new NotFoundException('Student not found in this school');
    let structure: any = null;
    if (data?.feeStructureId) {
      structure = await this.prisma.feeStructure.findFirst({ where: { id: data.feeStructureId, schoolId, isActive: true } });
      if (!structure) throw new NotFoundException('Fee structure not found or inactive');
      if (structure.classId) {
        const section = student.sectionId
          ? await this.prisma.section.findFirst({ where: { id: student.sectionId, class: { schoolId }, deletedAt: null }, select: { classId: true } })
          : null;
        if (!section || structure.classId !== section.classId) throw new BadRequestException("Selected fee structure is not assigned to this student's class");
      }
    }
    const amount = Number(data?.amountDue ?? data?.amount);
    const totalPaid = Number(data?.amountPaid);
    const discount = data?.discount === undefined || data?.discount === '' ? 0 : Number(data.discount);
    const fine = data?.fine === undefined || data?.fine === '' ? 0 : Number(data.fine);
    const method = String(data?.method || 'CASH').trim().toUpperCase();
    if (![amount, totalPaid, discount, fine].every(Number.isFinite)) throw new BadRequestException('Fee amounts must be valid numbers');
    if (amount <= 0) throw new BadRequestException('Amount due must be greater than zero');
    if (totalPaid < 0 || discount < 0 || fine < 0) throw new BadRequestException('Discount, fine and payment cannot be negative');
    if (discount > amount) throw new BadRequestException('Discount cannot exceed the amount due');
    if (!PAYMENT_METHODS.has(method)) throw new BadRequestException('Invalid payment method');
    const payable = amount - discount + fine;
    if (totalPaid > payable) throw new BadRequestException('Amount paid cannot exceed the final payable amount');
    const status = totalPaid >= payable ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'PENDING';
    let dueDate: Date | null = null;
    if (data?.dueDate) {
      dueDate = new Date(data.dueDate);
      if (Number.isNaN(dueDate.getTime())) throw new BadRequestException('Invalid due date');
    }
    const receiptNo = `FEE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const payment = await this.prisma.feePayment.create({
      data: { amount, discount, fine, totalPaid, method, status, dueDate, paidDate: totalPaid > 0 ? new Date() : null, receiptNo, remarks: data?.remarks?.trim() || null, schoolId, studentId: student.id, feeStructureId: structure?.id || null },
    });
    if (totalPaid > 0) {
      await this.prisma.accountEntry.create({ data: { type: 'INCOME', category: 'FEES', description: `Fee payment ${receiptNo}`, amount: totalPaid, date: new Date(), reference: receiptNo, schoolId } });
    }
    return payment;
  }

  async getAccountEntries(schoolId: string, query: any = {}) {
    const where: any = { schoolId };
    if (query.type) {
      const type = String(query.type).toUpperCase();
      if (!ACCOUNT_TYPES.has(type)) throw new BadRequestException('Invalid account entry type');
      where.type = type;
    }
    if (query.category) where.category = String(query.category).trim();
    if (query.from || query.to) {
      where.date = {};
      if (query.from) {
        const from = new Date(query.from);
        if (Number.isNaN(from.getTime())) throw new BadRequestException('Invalid from date');
        where.date.gte = from;
      }
      if (query.to) {
        const to = new Date(query.to);
        if (Number.isNaN(to.getTime())) throw new BadRequestException('Invalid to date');
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }
    return this.prisma.accountEntry.findMany({ where, orderBy: { date: 'desc' } });
  }

  async createAccountEntry(schoolId: string, data: any) {
    const type = String(data?.type || '').trim().toUpperCase();
    const category = String(data?.category || '').trim();
    const description = String(data?.description || '').trim();
    const amount = Number(data?.amount);
    const date = data?.date ? new Date(data.date) : new Date();
    if (!ACCOUNT_TYPES.has(type)) throw new BadRequestException('Account type must be INCOME or EXPENSE');
    if (!category) throw new BadRequestException('Category is required');
    if (!description) throw new BadRequestException('Description is required');
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Account amount must be greater than zero');
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid account date');
    return this.prisma.accountEntry.create({ data: { type, category, description, amount, date, reference: data?.reference?.trim() || null, attachmentUrl: data?.attachmentUrl?.trim() || null, schoolId } });
  }

  async getFinanceSummary(schoolId: string, query: any = {}) {
    const entries = await this.getAccountEntries(schoolId, query);
    const paymentWhere: any = { schoolId };
    if (query.from || query.to) {
      paymentWhere.createdAt = {};
      if (query.from) paymentWhere.createdAt.gte = new Date(query.from);
      if (query.to) paymentWhere.createdAt.lte = new Date(`${query.to}T23:59:59.999Z`);
    }
    const payments = await this.prisma.feePayment.findMany({ where: paymentWhere, select: { totalPaid: true } });
    const feeIncome = payments.reduce((sum, payment) => sum + Number(payment.totalPaid || 0), 0);
    const incomeEntries = entries.filter((entry) => entry.type === 'INCOME').reduce((sum, entry) => sum + Number(entry.amount), 0);
    const expenses = entries.filter((entry) => entry.type === 'EXPENSE').reduce((sum, entry) => sum + Number(entry.amount), 0);
    const nonFeeIncome = Math.max(0, incomeEntries - feeIncome);
    return { feeIncome, otherIncome: nonFeeIncome, totalIncome: incomeEntries, totalExpenses: expenses, netBalance: incomeEntries - expenses, entryCount: entries.length };
  }

  private async getStudentIdsForUser(user: any): Promise<string[]> {
    if (!user?.schoolId) return [];
    if (user.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({ where: { schoolId: user.schoolId, email: user.email, deletedAt: null }, select: { id: true } });
      return student ? [student.id] : [];
    }
    if (user.role === 'PARENT') {
      const parent = await this.prisma.parent.findFirst({ where: { schoolId: user.schoolId, email: user.email, deletedAt: null }, select: { id: true } });
      if (!parent) return [];
      const links = await this.prisma.studentParent.findMany({ where: { parentId: parent.id, student: { schoolId: user.schoolId, deletedAt: null } }, select: { studentId: true } });
      return links.map((link) => link.studentId);
    }
    return [];
  }
}
