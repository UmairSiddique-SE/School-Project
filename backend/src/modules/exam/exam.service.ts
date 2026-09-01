import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ExamService {
  constructor(private readonly prisma: PrismaService) {}

  async getExams(schoolId: string) {
    return this.prisma.exam.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { startDate: 'desc' },
    });
  }

  async createExam(schoolId: string, data: any) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });

    return this.prisma.exam.create({
      data: {
        name: data.name,
        type: data.type || 'UNIT_TEST',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalMarks: data.totalMarks ? parseFloat(data.totalMarks) : 100,
        passingMarks: data.passingMarks ? parseFloat(data.passingMarks) : 33,
        description: data.description || null,
        schoolId,
        academicYearId: academicYear?.id || null,
      },
    });
  }

  async getExamResults(schoolId: string, examId: string, subjectId: string) {
    const results = await this.prisma.examResult.findMany({
      where: {
        examId,
        subjectId,
        exam: { schoolId },
      },
      include: {
        student: { select: { name: true, rollNo: true } },
      },
    });
    return results;
  }

  async recordResults(schoolId: string, data: any) {
    const results = data.results; // Array of { studentId, subjectId, marksObtained, isAbsent, grade, remarks }
    const exam = await this.prisma.exam.findFirst({ where: { id: data.examId, schoolId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Exam not found');
    const studentIds = [...new Set<string>(results.map((r: any) => String(r.studentId)))];
    const subjectIds = [...new Set<string>(results.map((r: any) => String(r.subjectId)))];
    const [studentCount, subjectCount] = await Promise.all([
      this.prisma.student.count({ where: { id: { in: studentIds }, schoolId, deletedAt: null } }),
      this.prisma.subject.count({ where: { id: { in: subjectIds }, schoolId, deletedAt: null } }),
    ]);
    if (studentCount !== studentIds.length || subjectCount !== subjectIds.length) {
      throw new NotFoundException('Student or subject not found');
    }

    return this.prisma.$transaction(
      results.map((r: any) => {
        return this.prisma.examResult.upsert({
          where: {
            examId_studentId_subjectId: {
              examId: data.examId,
              studentId: r.studentId,
              subjectId: r.subjectId,
            },
          },
          create: {
            marksObtained: parseFloat(r.marksObtained),
            isAbsent: r.isAbsent || false,
            grade: r.grade || null,
            remarks: r.remarks || null,
            examId: data.examId,
            studentId: r.studentId,
            subjectId: r.subjectId,
          },
          update: {
            marksObtained: parseFloat(r.marksObtained),
            isAbsent: r.isAbsent || false,
            grade: r.grade || null,
            remarks: r.remarks || null,
          },
        });
      })
    );
  }
}
