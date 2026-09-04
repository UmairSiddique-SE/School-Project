import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ExamService {
  constructor(private readonly prisma: PrismaService) {}

  async getExams(schoolId: string) {
    return this.prisma.exam.findMany({ where: { schoolId, deletedAt: null }, orderBy: { startDate: 'desc' } });
  }

  async createExam(schoolId: string, data: any) {
    if (!data.name?.trim()) throw new BadRequestException('Exam name is required');
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) throw new BadRequestException('Valid exam start and end dates are required');
    if (endDate < startDate) throw new BadRequestException('Exam end date cannot be before start date');
    const totalMarks = data.totalMarks === undefined || data.totalMarks === '' ? 100 : Number(data.totalMarks);
    const passingMarks = data.passingMarks === undefined || data.passingMarks === '' ? 33 : Number(data.passingMarks);
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) throw new BadRequestException('Total marks must be greater than 0');
    if (!Number.isFinite(passingMarks) || passingMarks < 0 || passingMarks > totalMarks) throw new BadRequestException('Passing marks must be between 0 and total marks');
    const academicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
    let sectionId: string | null = null;
    if (data.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId }, deletedAt: null } });
      if (!section) throw new NotFoundException('Section not found');
      sectionId = section.id;
    }
    return this.prisma.exam.create({ data: { name: data.name.trim(), type: data.type || 'UNIT_TEST', startDate, endDate, totalMarks, passingMarks, description: data.description?.trim() || null, schoolId, academicYearId: academicYear?.id || null, sectionId } });
  }

  async getExamResults(schoolId: string, examId: string, subjectId: string) {
    if (!examId || !subjectId) throw new BadRequestException('Exam and subject are required');
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Exam not found');
    const subject = await this.prisma.subject.findFirst({ where: { id: subjectId, schoolId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Subject not found');
    return this.prisma.examResult.findMany({ where: { examId, subjectId, exam: { schoolId } }, include: { student: { select: { name: true, rollNo: true, admissionNo: true } } }, orderBy: { student: { name: 'asc' } } });
  }

  async recordResults(schoolId: string, data: any, teacherEmail?: string) {
    if (!data.examId || !Array.isArray(data.results) || data.results.length === 0) throw new BadRequestException('Exam and at least one result are required');
    const exam = await this.prisma.exam.findFirst({ where: { id: data.examId, schoolId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Exam not found');
    if (exam.isPublished) throw new BadRequestException('Published exam results cannot be changed');

    const normalized = data.results.map((r: any) => ({ studentId: String(r.studentId || ''), subjectId: String(r.subjectId || ''), marksObtained: r.isAbsent ? 0 : Number(r.marksObtained), isAbsent: Boolean(r.isAbsent), grade: r.grade?.trim() || null, remarks: r.remarks?.trim() || null }));
    if (normalized.some((r: any) => !r.studentId || !r.subjectId)) throw new BadRequestException('Each result requires a student and subject');
    if (normalized.some((r: any) => !Number.isFinite(r.marksObtained) || r.marksObtained < 0 || r.marksObtained > exam.totalMarks)) throw new BadRequestException(`Marks must be between 0 and ${exam.totalMarks}`);

    const studentIds = Array.from(new Set(normalized.map((r: any) => r.studentId))) as string[];
    const subjectIds = Array.from(new Set(normalized.map((r: any) => r.subjectId))) as string[];
    const [students, subjects] = await Promise.all([
      this.prisma.student.findMany({ where: { id: { in: studentIds }, schoolId, deletedAt: null }, select: { id: true, sectionId: true } }),
      this.prisma.subject.findMany({ where: { id: { in: subjectIds }, schoolId, deletedAt: null }, select: { id: true } }),
    ]);
    if (students.length !== studentIds.length || subjects.length !== subjectIds.length) throw new NotFoundException('Student or subject not found');
    const sectionIds = Array.from(new Set(students.map((s) => s.sectionId).filter((id): id is string => Boolean(id))));
    const sections = sectionIds.length ? await this.prisma.section.findMany({ where: { id: { in: sectionIds }, class: { schoolId }, deletedAt: null }, select: { id: true, classId: true } }) : [];
    const sectionMap = new Map(sections.map((s) => [s.id, s]));
    const studentMap = new Map(students.map((s) => [s.id, s]));
    if (students.some((s) => !s.sectionId || !sectionMap.has(s.sectionId))) throw new BadRequestException('Student section/class is required for results');
    if (exam.sectionId && students.some((s) => s.sectionId !== exam.sectionId)) throw new BadRequestException('All students must belong to the exam section');

    if (teacherEmail) {
      const teacher = await this.prisma.teacher.findFirst({ where: { email: teacherEmail, schoolId, deletedAt: null } });
      if (!teacher) throw new ForbiddenException('Teacher account is not linked to this school');
      for (const result of normalized) {
        const student = studentMap.get(result.studentId);
        const section = student?.sectionId ? sectionMap.get(student.sectionId) : undefined;
        if (!section) throw new BadRequestException('Student section/class is required for results');
        const assignment = await this.prisma.classSubject.findFirst({ where: { classId: section.classId, subjectId: result.subjectId, teacherId: teacher.id } });
        if (!assignment) throw new ForbiddenException('You are not assigned to one or more selected subjects');
      }
    }

    return this.prisma.$transaction(normalized.map((r: any) => this.prisma.examResult.upsert({
      where: { examId_studentId_subjectId: { examId: data.examId, studentId: r.studentId, subjectId: r.subjectId } },
      create: { marksObtained: r.marksObtained, isAbsent: r.isAbsent, grade: r.grade, remarks: r.remarks, examId: data.examId, studentId: r.studentId, subjectId: r.subjectId },
      update: { marksObtained: r.marksObtained, isAbsent: r.isAbsent, grade: r.grade, remarks: r.remarks },
    })));
  }
}
