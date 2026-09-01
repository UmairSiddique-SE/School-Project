import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Disable foreign keys for SQLite to clear database easily
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');

  // Clear existing data
  await prisma.auditLog.deleteMany({});
  await prisma.feePayment.deleteMany({});
  await prisma.feeStructure.deleteMany({});
  await prisma.examResult.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.studentParent.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.classSubject.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.academicYear.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.school.deleteMany({});
  
  // Clear newer models
  try { await prisma.book.deleteMany({}); } catch(e){}
  try { await prisma.bookIssue.deleteMany({}); } catch(e){}
  try { await prisma["transportRoute"]?.deleteMany({}); } catch(e){}
  try { await prisma["vehicle"]?.deleteMany({}); } catch(e){}
  try { await prisma["transportAssignment"]?.deleteMany({}); } catch(e){}
  try { await prisma["hostel"]?.deleteMany({}); } catch(e){}
  try { await prisma["hostelRoom"]?.deleteMany({}); } catch(e){}
  try { await prisma["hostelAllocation"]?.deleteMany({}); } catch(e){}
  try { await prisma.announcement.deleteMany({}); } catch(e){}
  try { await prisma.notification.deleteMany({}); } catch(e){}
  try { await prisma["accountEntry"]?.deleteMany({}); } catch(e){}
  try { await prisma.staff.deleteMany({}); } catch(e){}
  try { await prisma["leaveRequest"]?.deleteMany({}); } catch(e){}
  try { await prisma["payroll"]?.deleteMany({}); } catch(e){}
  try { await prisma.homework.deleteMany({}); } catch(e){}
  try { await prisma["homeworkSubmission"]?.deleteMany({}); } catch(e){}
  try { await prisma["event"]?.deleteMany({}); } catch(e){}
  try { await prisma["document"]?.deleteMany({}); } catch(e){}

  // Enable foreign keys
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  const passwordHash = await bcrypt.hash('admin123', 12);
  const teacherHash = await bcrypt.hash('teacher123', 12);
  const studentHash = await bcrypt.hash('student123', 12);
  const parentHash = await bcrypt.hash('parent123', 12);

  // 1. Create Super Admin (not linked to any specific school)
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@edusphere.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super Admin user created:', superAdmin.email);

  // 2. Create Demo School
  const school = await prisma.school.create({
    data: {
      name: 'EduSphere Demo School',
      slug: 'demo',
      email: 'info@demoschool.edu',
      phone: '+1 555 123 4567',
      address: '123 Learning Way, Science City',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      isActive: true,
    },
  });
  console.log('Demo School created:', school.name);

  // 3. Create Subscription for Demo School
  await prisma.subscription.create({
    data: {
      schoolId: school.id,
      plan: 'STARTER',
      status: 'ACTIVE',
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  // 4. Create School Admin User
  const schoolAdmin = await prisma.user.create({
    data: {
      name: 'John School Admin',
      email: 'admin@edusphere.com',
      passwordHash,
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
    },
  });
  console.log('School Admin user created:', schoolAdmin.email);

  // 5. Create Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2026-2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true,
      schoolId: school.id,
    },
  });

  // 6. Create Classes
  const grade5 = await prisma.class.create({
    data: {
      name: 'Grade 5',
      numeric: 5,
      schoolId: school.id,
      academicYearId: academicYear.id,
    },
  });

  // 7. Create Teacher
  const teacher = await prisma.teacher.create({
    data: {
      employeeNo: 'TCH001',
      name: 'Sarah Mitchell',
      email: 'teacher@edusphere.com',
      phone: '+1 555 234 5678',
      gender: 'FEMALE',
      qualification: 'M.Ed. in Mathematics',
      experience: 8,
      salary: 4500,
      schoolId: school.id,
    },
  });

  // Create User account for Teacher
  await prisma.user.create({
    data: {
      name: teacher.name,
      email: teacher.email,
      passwordHash: teacherHash,
      role: 'TEACHER',
      schoolId: school.id,
    },
  });
  console.log('Teacher user created:', teacher.email);

  // 8. Create Class Section
  const sectionA = await prisma.section.create({
    data: {
      name: 'Section A',
      classId: grade5.id,
      teacherId: teacher.id,
      capacity: 35,
    },
  });

  // 9. Create Subject
  const math = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      code: 'MATH5',
      description: 'Elementary Mathematics Grade 5',
      schoolId: school.id,
    },
  });

  // Link class and subject with teacher
  await prisma.classSubject.create({
    data: {
      classId: grade5.id,
      subjectId: math.id,
      teacherId: teacher.id,
    },
  });

  // 10. Create Student
  const student = await prisma.student.create({
    data: {
      admissionNo: 'STD001',
      name: 'Alex Mercer',
      email: 'student@edusphere.com',
      rollNo: '1',
      phone: '+1 555 345 6789',
      address: '456 Student St, Boston',
      gender: 'MALE',
      dateOfBirth: new Date('2015-05-12'),
      schoolId: school.id,
      sectionId: sectionA.id,
    },
  });

  // Create User account for Student
  await prisma.user.create({
    data: {
      name: student.name,
      email: student.email!,
      passwordHash: studentHash,
      role: 'STUDENT',
      schoolId: school.id,
    },
  });
  console.log('Student user created:', student.email);

  // 11. Create Parent
  const parent = await prisma.parent.create({
    data: {
      name: 'Robert Mercer',
      email: 'parent@edusphere.com',
      phone: '+1 555 456 7890',
      relation: 'FATHER',
      schoolId: school.id,
    },
  });

  // Link Parent to Student
  await prisma.studentParent.create({
    data: {
      parentId: parent.id,
      studentId: student.id,
      isPrimary: true,
    },
  });

  // Create User account for Parent
  await prisma.user.create({
    data: {
      name: parent.name,
      email: parent.email!,
      passwordHash: parentHash,
      role: 'PARENT',
      schoolId: school.id,
    },
  });
  console.log('Parent user created:', parent.email);

  // 12. Create Exam
  const midterm = await prisma.exam.create({
    data: {
      name: 'Midterm Exam 2026',
      type: 'MIDTERM',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-25'),
      totalMarks: 100,
      passingMarks: 33,
      schoolId: school.id,
      academicYearId: academicYear.id,
      sectionId: sectionA.id,
    },
  });

  // Create Exam Result
  await prisma.examResult.create({
    data: {
      marksObtained: 85,
      grade: 'A',
      examId: midterm.id,
      studentId: student.id,
      subjectId: math.id,
    },
  });

  // 13. Create Fee Structure
  const feeStructure = await prisma.feeStructure.create({
    data: {
      name: 'First Term Tuition Fee',
      amount: 150,
      frequency: 'ONE_TIME',
      schoolId: school.id,
      classId: grade5.id,
    },
  });

  // Create Fee Payment
  await prisma.feePayment.create({
    data: {
      amount: 150,
      discount: 10,
      fine: 0,
      totalPaid: 140,
      status: 'PAID',
      method: 'ONLINE',
      paidDate: new Date(),
      schoolId: school.id,
      studentId: student.id,
      feeStructureId: feeStructure.id,
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
