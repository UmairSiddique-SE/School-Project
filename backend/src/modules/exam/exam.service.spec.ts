import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExamService } from './exam.service';

describe('ExamService role scoping', () => {
  const prisma = {
    exam: { findFirst: jest.fn(), findMany: jest.fn() },
    student: { findFirst: jest.fn(), findMany: jest.fn() },
    teacher: { findFirst: jest.fn() },
    section: { findMany: jest.fn() },
    subject: { findMany: jest.fn() },
    classSubject: { findFirst: jest.fn(), findMany: jest.fn() },
    school: { findFirst: jest.fn() },
    examResult: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: ExamService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExamService(prisma as any);
  });

  it('only looks up the requesting student when loading a report card', async () => {
    prisma.student.findFirst.mockResolvedValue(null);
    prisma.school.findFirst.mockResolvedValue(null);

    await expect(service.getStudentReportCard(
      'school-1',
      'another-student',
      undefined,
      { role: 'STUDENT', email: 'student@example.com' },
    )).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.student.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'another-student',
        schoolId: 'school-1',
        email: 'student@example.com',
        isActive: true,
      }),
    }));
    expect(prisma.examResult.findMany).not.toHaveBeenCalled();
  });

  it('blocks teachers from results for an unassigned exam section', async () => {
    prisma.exam.findFirst.mockResolvedValue({ id: 'exam-1', sectionId: 'section-2' });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
    prisma.section.findMany.mockResolvedValue([{ id: 'section-1', classId: 'class-1' }]);

    await expect(service.getExamResults(
      'school-1',
      'exam-1',
      undefined,
      { role: 'TEACHER', email: 'teacher@example.com' },
    )).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.examResult.findMany).not.toHaveBeenCalled();
  });

  it('blocks teachers from recording marks for unassigned subjects', async () => {
    prisma.exam.findFirst.mockResolvedValue({
      id: 'exam-1',
      sectionId: 'section-1',
      totalMarks: 100,
      passingMarks: 33,
    });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
    prisma.section.findMany.mockResolvedValue([{ id: 'section-1', classId: 'class-1' }]);
    prisma.student.findMany.mockResolvedValue([{
      id: 'student-1',
      sectionId: 'section-1',
      section: { classId: 'class-1' },
    }]);
    prisma.subject.findMany.mockResolvedValue([{ id: 'subject-1' }]);
    prisma.classSubject.findMany.mockResolvedValue([]);

    await expect(service.recordResults('school-1', {
      examId: 'exam-1',
      results: [{ studentId: 'student-1', subjectId: 'subject-1', marksObtained: 80 }],
    }, 'teacher@example.com')).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
