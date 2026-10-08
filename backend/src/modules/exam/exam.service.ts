import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export function computeGrade(percentage: number): { grade: string; remarks: string; isPassed: boolean } {
  if (percentage >= 85) return { grade: 'A+', remarks: 'Outstanding Performance', isPassed: true };
  if (percentage >= 75) return { grade: 'A', remarks: 'Excellent', isPassed: true };
  if (percentage >= 65) return { grade: 'B', remarks: 'Good', isPassed: true };
  if (percentage >= 50) return { grade: 'C', remarks: 'Satisfactory', isPassed: true };
  if (percentage >= 33) return { grade: 'D', remarks: 'Pass', isPassed: true };
  return { grade: 'F', remarks: 'Needs Improvement / Fail', isPassed: false };
}

@Injectable()
export class ExamService {
  constructor(private readonly prisma: PrismaService) {}

  async getExams(schoolId: string, user?: any) {
    const baseWhere: any = { schoolId, deletedAt: null };
    if (user?.role === 'STUDENT') baseWhere.isPublished = true;
    return this.prisma.exam.findMany({
      where: baseWhere,
      include: {
        section: { include: { class: { select: { id: true, name: true } } } },
        academicYear: { select: { id: true, name: true, isCurrent: true } },
        _count: { select: { results: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createExam(schoolId: string, data: any) {
    if (!data.name?.trim()) throw new BadRequestException('Exam name is required');
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Valid exam start and end dates are required');
    }
    if (endDate < startDate) throw new BadRequestException('Exam end date cannot be before start date');

    const totalMarks = data.totalMarks === undefined || data.totalMarks === '' ? 100 : Number(data.totalMarks);
    const passingMarks = data.passingMarks === undefined || data.passingMarks === '' ? 33 : Number(data.passingMarks);
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) throw new BadRequestException('Total marks must be greater than 0');
    if (!Number.isFinite(passingMarks) || passingMarks < 0 || passingMarks > totalMarks) {
      throw new BadRequestException('Passing marks must be between 0 and total marks');
    }

    let academicYearId = data.academicYearId;
    if (!academicYearId) {
      const currentYear = await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
      academicYearId = currentYear?.id || null;
    }

    let sectionId: string | null = null;
    if (data.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, class: { schoolId }, deletedAt: null } });
      if (!section) throw new NotFoundException('Section not found');
      sectionId = section.id;
    }

    return this.prisma.exam.create({
      data: {
        name: data.name.trim(),
        type: data.type || 'MIDTERM',
        startDate,
        endDate,
        totalMarks,
        passingMarks,
        description: data.description?.trim() || null,
        schoolId,
        academicYearId,
        sectionId,
      },
      include: {
        section: { include: { class: true } },
        academicYear: true,
      },
    });
  }

  async updateExam(schoolId: string, examId: string, data: any) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Exam not found');

    const updateData: any = {};
    if (data.name) updateData.name = String(data.name).trim();
    if (data.type) updateData.type = String(data.type).trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.totalMarks !== undefined) updateData.totalMarks = Number(data.totalMarks);
    if (data.passingMarks !== undefined) updateData.passingMarks = Number(data.passingMarks);
    if (data.sectionId !== undefined) updateData.sectionId = data.sectionId || null;
    if (data.academicYearId !== undefined) updateData.academicYearId = data.academicYearId || null;

    return this.prisma.exam.update({
      where: { id: examId },
      data: updateData,
      include: { section: { include: { class: true } }, academicYear: true },
    });
  }

  async deleteExam(schoolId: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Exam not found');
    return this.prisma.exam.update({ where: { id: examId }, data: { deletedAt: new Date() } });
  }

  async publishExam(schoolId: string, examId: string, published: boolean) {
    if (!examId?.trim()) throw new BadRequestException('Exam ID is required');
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId, deletedAt: null }, select: { id: true, isPublished: true } });
    if (!exam) throw new NotFoundException('Exam not found');
    if (published && !exam.isPublished) {
      const resultCount = await this.prisma.examResult.count({ where: { examId: exam.id } });
      if (resultCount === 0) throw new BadRequestException('Add at least one result before publishing the exam');
    }
    return this.prisma.exam.update({ where: { id: exam.id }, data: { isPublished: published } });
  }

  async getExamResults(schoolId: string, examId: string, subjectId?: string, user?: any) {
    if (!examId) throw new BadRequestException('Exam ID is required');
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Exam not found');
    if (user?.role === 'STUDENT' && !exam.isPublished) throw new ForbiddenException('Exam results are not published');

    const where: any = { examId, exam: { schoolId } };
    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (user?.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({ where: { schoolId, email: user.email, deletedAt: null, isActive: true }, select: { id: true } });
      if (!student) throw new NotFoundException('Student profile not found');
      where.studentId = student.id;
    }

    return this.prisma.examResult.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, rollNo: true, admissionNo: true, sectionId: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ student: { name: 'asc' } }, { subject: { name: 'asc' } }],
    });
  }

  async getMyResults(schoolId: string, user: any) {
    const student = await this.prisma.student.findFirst({
      where: { schoolId, email: user?.email, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const results = await this.prisma.examResult.findMany({
      where: { studentId: student.id, exam: { schoolId, deletedAt: null, isPublished: true } },
      include: {
        exam: { select: { id: true, name: true, type: true, startDate: true, totalMarks: true, passingMarks: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ exam: { startDate: 'desc' } }, { subject: { name: 'asc' } }],
    });

    return results.map((result) => {
      const percentage = result.exam.totalMarks > 0 ? (result.marksObtained / result.exam.totalMarks) * 100 : 0;
      const grading = computeGrade(percentage);
      return {
        id: result.id,
        examId: result.exam.id,
        examName: result.exam.name,
        examType: result.exam.type,
        examDate: result.exam.startDate,
        subjectId: result.subject.id,
        subjectName: result.subject.name,
        subjectCode: result.subject.code,
        marksObtained: result.marksObtained,
        totalMarks: result.exam.totalMarks,
        passingMarks: result.exam.passingMarks,
        percentage: Number(percentage.toFixed(1)),
        isAbsent: result.isAbsent,
        grade: result.grade || grading.grade,
        isPassed: !result.isAbsent && result.marksObtained >= result.exam.passingMarks,
        remarks: result.remarks || grading.remarks,
      };
    });
  }

  async recordResults(schoolId: string, data: any, teacherEmail?: string) {
    if (!data.examId || !Array.isArray(data.results) || data.results.length === 0) {
      throw new BadRequestException('Exam and at least one result are required');
    }
    const exam = await this.prisma.exam.findFirst({ where: { id: data.examId, schoolId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Exam not found');

    const normalized = data.results.map((r: any) => {
      const isAbsent = Boolean(r.isAbsent);
      const marksObtained = isAbsent ? 0 : Number(r.marksObtained || 0);
      const percentage = exam.totalMarks > 0 ? (marksObtained / exam.totalMarks) * 100 : 0;
      const autoGrading = computeGrade(percentage);
      const grade = r.grade?.trim() || (isAbsent ? 'F' : autoGrading.grade);
      const remarks = r.remarks?.trim() || (isAbsent ? 'Absent' : autoGrading.remarks);

      return {
        studentId: String(r.studentId || ''),
        subjectId: String(r.subjectId || ''),
        marksObtained,
        isAbsent,
        grade,
        remarks,
      };
    });

    if (normalized.some((r: any) => !r.studentId || !r.subjectId)) {
      throw new BadRequestException('Each result requires a valid student and subject');
    }
    if (normalized.some((r: any) => !Number.isFinite(r.marksObtained) || r.marksObtained < 0 || r.marksObtained > exam.totalMarks)) {
      throw new BadRequestException(`Marks must be between 0 and ${exam.totalMarks}`);
    }

    const studentIds = Array.from(new Set(normalized.map((r: any) => r.studentId))) as string[];
    const subjectIds = Array.from(new Set(normalized.map((r: any) => r.subjectId))) as string[];

    const [students, subjects] = await Promise.all([
      this.prisma.student.findMany({ where: { id: { in: studentIds }, schoolId, deletedAt: null }, select: { id: true, sectionId: true } }),
      this.prisma.subject.findMany({ where: { id: { in: subjectIds }, schoolId, deletedAt: null }, select: { id: true } }),
    ]);
    if (students.length !== studentIds.length || subjects.length !== subjectIds.length) {
      throw new NotFoundException('One or more students or subjects not found');
    }

    return this.prisma.$transaction(
      normalized.map((r: any) =>
        this.prisma.examResult.upsert({
          where: { examId_studentId_subjectId: { examId: data.examId, studentId: r.studentId, subjectId: r.subjectId } },
          create: {
            marksObtained: r.marksObtained,
            isAbsent: r.isAbsent,
            grade: r.grade,
            remarks: r.remarks,
            examId: data.examId,
            studentId: r.studentId,
            subjectId: r.subjectId,
          },
          update: {
            marksObtained: r.marksObtained,
            isAbsent: r.isAbsent,
            grade: r.grade,
            remarks: r.remarks,
          },
        }),
      ),
    );
  }

  // ─── Academic Reports & Analytics ───
  async getExamAnalytics(schoolId: string, examId: string, sectionId?: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId, deletedAt: null },
      include: {
        section: { include: { class: true } },
        academicYear: true,
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const results = await this.prisma.examResult.findMany({
      where: {
        examId,
        exam: { schoolId },
        ...(sectionId ? { student: { sectionId } } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            rollNo: true,
            section: { include: { class: true } },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    // Group results by student
    const studentMap = new Map<string, any>();
    const subjectMap = new Map<string, { id: string; name: string; totalMarks: number; marks: number[]; passed: number; failed: number }>();

    for (const r of results) {
      // Aggregate Student Data
      if (!studentMap.has(r.studentId)) {
        studentMap.set(r.studentId, {
          studentId: r.student.id,
          name: r.student.name,
          admissionNo: r.student.admissionNo,
          rollNo: r.student.rollNo,
          className: r.student.section?.class?.name || 'N/A',
          sectionName: r.student.section?.name || 'N/A',
          totalObtained: 0,
          maxPossible: 0,
          subjectCount: 0,
          subjects: [],
          hasFailedAny: false,
          absentCount: 0,
        });
      }
      const st = studentMap.get(r.studentId);
      const isPassed = !r.isAbsent && r.marksObtained >= exam.passingMarks;
      if (!isPassed) st.hasFailedAny = true;
      if (r.isAbsent) st.absentCount += 1;

      st.totalObtained += r.marksObtained;
      st.maxPossible += exam.totalMarks;
      st.subjectCount += 1;
      st.subjects.push({
        subjectId: r.subject.id,
        subjectName: r.subject.name,
        marksObtained: r.marksObtained,
        totalMarks: exam.totalMarks,
        grade: r.grade,
        isAbsent: r.isAbsent,
        isPassed,
      });

      // Aggregate Subject Data
      if (!subjectMap.has(r.subjectId)) {
        subjectMap.set(r.subjectId, {
          id: r.subject.id,
          name: r.subject.name,
          totalMarks: exam.totalMarks,
          marks: [],
          passed: 0,
          failed: 0,
        });
      }
      const sub = subjectMap.get(r.subjectId)!;
      sub.marks.push(r.marksObtained);
      if (isPassed) sub.passed += 1;
      else sub.failed += 1;
    }

    const studentSummaries = Array.from(studentMap.values()).map((st) => {
      const percentage = st.maxPossible > 0 ? (st.totalObtained / st.maxPossible) * 100 : 0;
      const grading = computeGrade(percentage);
      return {
        ...st,
        percentage: Number(percentage.toFixed(1)),
        grade: grading.grade,
        isOverallPass: !st.hasFailedAny && percentage >= (exam.passingMarks / exam.totalMarks) * 100,
      };
    });

    // Sort by percentage descending to compute positions
    studentSummaries.sort((a, b) => b.percentage - a.percentage);
    studentSummaries.forEach((st, idx) => {
      st.position = idx + 1;
    });

    const totalStudents = studentSummaries.length;
    const passedStudents = studentSummaries.filter((s) => s.isOverallPass).length;
    const failedStudents = totalStudents - passedStudents;
    const passPercentage = totalStudents > 0 ? Number(((passedStudents / totalStudents) * 100).toFixed(1)) : 0;
    const averagePercentage = totalStudents > 0 ? Number((studentSummaries.reduce((sum, s) => sum + s.percentage, 0) / totalStudents).toFixed(1)) : 0;
    const highestPercentage = totalStudents > 0 ? studentSummaries[0].percentage : 0;

    const subjectAnalytics = Array.from(subjectMap.values()).map((sub) => {
      const count = sub.marks.length;
      const sum = sub.marks.reduce((a, b) => a + b, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;
      const highest = count > 0 ? Math.max(...sub.marks) : 0;
      const lowest = count > 0 ? Math.min(...sub.marks) : 0;
      const subPassRate = count > 0 ? Number(((sub.passed / count) * 100).toFixed(1)) : 0;
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        averageMarks: avg,
        highestMarks: highest,
        lowestMarks: lowest,
        passPercentage: subPassRate,
        totalAppeared: count,
        passed: sub.passed,
        failed: sub.failed,
      };
    });

    return {
      exam: {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        startDate: exam.startDate,
        endDate: exam.endDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        isPublished: exam.isPublished,
        className: exam.section?.class?.name || 'All Classes',
        sectionName: exam.section?.name || 'All Sections',
        academicYear: exam.academicYear?.name || 'Current Session',
      },
      summary: {
        totalStudents,
        passedStudents,
        failedStudents,
        passPercentage,
        averagePercentage,
        highestPercentage,
      },
      subjectAnalytics,
      students: studentSummaries,
    };
  }

  async getStudentReportCard(schoolId: string, studentId: string, academicYearId?: string) {
    const [student, school] = await Promise.all([
      this.prisma.student.findFirst({
        where: { id: studentId, schoolId, deletedAt: null },
        include: {
          section: { include: { class: true } },
          parents: { include: { parent: true } },
        },
      }),
      this.prisma.school.findFirst({
        where: { id: schoolId },
        select: { id: true, name: true, email: true, phone: true, address: true, logoUrl: true, city: true },
      }),
    ]);
    if (!student) throw new NotFoundException('Student not found');

    const results = await this.prisma.examResult.findMany({
      where: {
        studentId,
        exam: {
          schoolId,
          deletedAt: null,
          isPublished: true,
          ...(academicYearId ? { academicYearId } : {}),
        },
      },
      include: {
        exam: true,
        subject: true,
      },
      orderBy: [{ exam: { startDate: 'desc' } }, { subject: { name: 'asc' } }],
    });

    // Group by Exam
    const examMap = new Map<string, any>();
    for (const r of results) {
      if (!examMap.has(r.examId)) {
        examMap.set(r.examId, {
          examId: r.exam.id,
          examName: r.exam.name,
          examType: r.exam.type,
          startDate: r.exam.startDate,
          endDate: r.exam.endDate,
          totalMarks: r.exam.totalMarks,
          passingMarks: r.exam.passingMarks,
          marksObtainedTotal: 0,
          maxMarksTotal: 0,
          subjects: [],
        });
      }
      const ex = examMap.get(r.examId);
      const percentage = (r.marksObtained / r.exam.totalMarks) * 100;
      const grading = computeGrade(percentage);
      const isPassed = !r.isAbsent && r.marksObtained >= r.exam.passingMarks;

      ex.marksObtainedTotal += r.marksObtained;
      ex.maxMarksTotal += r.exam.totalMarks;
      ex.subjects.push({
        subjectId: r.subject.id,
        subjectName: r.subject.name,
        subjectCode: r.subject.code,
        marksObtained: r.marksObtained,
        totalMarks: r.exam.totalMarks,
        passingMarks: r.exam.passingMarks,
        percentage: Number(percentage.toFixed(1)),
        grade: r.grade || grading.grade,
        isPassed,
        isAbsent: r.isAbsent,
        remarks: r.remarks || grading.remarks,
      });
    }

    const examCards = Array.from(examMap.values()).map((ex) => {
      const overallPercentage = ex.maxMarksTotal > 0 ? (ex.marksObtainedTotal / ex.maxMarksTotal) * 100 : 0;
      const overallGrade = computeGrade(overallPercentage);
      const allPassed = ex.subjects.every((s: any) => s.isPassed);

      return {
        ...ex,
        overallPercentage: Number(overallPercentage.toFixed(1)),
        overallGrade: overallGrade.grade,
        isPassed: allPassed,
        remarks: allPassed ? overallGrade.remarks : 'Needs Improvement',
      };
    });

    return {
      school,
      student: {
        id: student.id,
        name: student.name,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        gender: student.gender,
        className: student.section?.class?.name || 'N/A',
        sectionName: student.section?.name || 'N/A',
        avatarUrl: student.avatarUrl,
        fatherName: student.parents?.[0]?.parent?.fatherName || student.parents?.[0]?.parent?.name || 'N/A',
      },
      exams: examCards,
    };
  }
}
