import { Class, PrismaClient, Section, Subject } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Full School ERP Database Seed...');

  // Disable SQLite foreign keys temporarily for clean reset
  try {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  } catch {
    console.log('Note: PRAGMA foreign_keys command skipped');
  }

  // Clear existing tables
  try {
    await prisma.auditLog.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.feePayment.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.feeStructure.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.examResult.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.exam.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.attendance.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.studentParent.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.parent.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.student.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.classSubject.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.subject.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.section.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.class.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.academicYear.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.teacher.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.staff.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.announcement.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.notification.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.transportRoute.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.building.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.subscription.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.refreshToken.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.user.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }
  try {
    await prisma.school.deleteMany({});
  } catch {
    // A table may not exist yet in older development databases.
  }

  try {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  } catch {
    // A table may not exist yet in older development databases.
  }

  const defaultHash = await bcrypt.hash('12345678', 12);
  const teacherHash = await bcrypt.hash('teacher123', 12);
  const studentHash = await bcrypt.hash('student123', 12);
  const parentHash = await bcrypt.hash('parent123', 12);

  // 1. Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email: 'superadmin@gmail.com',
      passwordHash: defaultHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 2. Primary School
  const school = await prisma.school.create({
    data: {
      name: 'EduSphere International School',
      slug: 'edusphere-international',
      email: 'schooladmin@gmail.com',
      phone: '+92 42 35889000',
      address: 'Main Boulevard, Gulberg III',
      city: 'Lahore',
      state: 'Punjab',
      country: 'Pakistan',
      postalCode: '54000',
      isActive: true,
    },
  });
  console.log(`✅ Main School created: ${school.name} (${school.slug})`);

  // Create Subscription for the School
  await prisma.subscription.create({
    data: {
      schoolId: school.id,
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      amount: 499,
      currency: 'USD',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. School Admin User
  const schoolAdmin = await prisma.user.create({
    data: {
      name: 'Prof. Tariq Mahmood',
      email: 'schooladmin@gmail.com',
      passwordHash: defaultHash,
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ School Admin created: ${schoolAdmin.email}`);

  // 4. Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2026-2027',
      startDate: new Date('2026-08-15'),
      endDate: new Date('2027-06-15'),
      isCurrent: true,
      schoolId: school.id,
    },
  });

  // 5. Teachers & Staff
  const teacherSarah = await prisma.teacher.create({
    data: {
      employeeNo: 'TCH-001',
      name: 'Ms. Sarah Mitchell',
      email: 'teacher@gmail.com',
      phone: '+92 300 1234567',
      gender: 'FEMALE',
      qualification: 'M.Sc. Mathematics, B.Ed',
      experience: 7,
      salary: 85000,
      joiningDate: new Date('2022-08-01'),
      schoolId: school.id,
    },
  });

  await prisma.user.create({
    data: {
      name: teacherSarah.name,
      email: teacherSarah.email,
      passwordHash: teacherHash,
      role: 'TEACHER',
      schoolId: school.id,
      isActive: true,
      emailVerified: true,
    },
  });

  const teacherAhmed = await prisma.teacher.create({
    data: {
      employeeNo: 'TCH-002',
      name: 'Dr. Ahmed Khan',
      email: 'ahmed.khan@edusphere.com',
      phone: '+92 301 9876543',
      gender: 'MALE',
      qualification: 'Ph.D. Physics',
      experience: 12,
      salary: 110000,
      joiningDate: new Date('2020-01-15'),
      schoolId: school.id,
    },
  });

  const teacherAyesha = await prisma.teacher.create({
    data: {
      employeeNo: 'TCH-003',
      name: 'Ms. Ayesha Siddiqui',
      email: 'ayesha.s@edusphere.com',
      phone: '+92 321 4567890',
      gender: 'FEMALE',
      qualification: 'M.Phil English Literature',
      experience: 5,
      salary: 75000,
      joiningDate: new Date('2023-08-01'),
      schoolId: school.id,
    },
  });

  // 6. Classes and Sections
  const classNames = [
    { name: 'Grade 1', num: 1 },
    { name: 'Grade 2', num: 2 },
    { name: 'Grade 3', num: 3 },
    { name: 'Grade 4', num: 4 },
    { name: 'Grade 5', num: 5 },
    { name: 'Grade 6', num: 6 },
    { name: 'Grade 7', num: 7 },
    { name: 'Grade 8', num: 8 },
    { name: 'Grade 9', num: 9 },
    { name: 'Grade 10', num: 10 },
  ];

  const createdClasses: Class[] = [];
  const createdSections: Section[] = [];

  for (const c of classNames) {
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        numeric: c.num,
        schoolId: school.id,
        academicYearId: academicYear.id,
      },
    });
    createdClasses.push(cls);

    const secA = await prisma.section.create({
      data: {
        name: 'Section A - Falcon',
        classId: cls.id,
        capacity: 35,
        teacherId: c.num % 2 === 0 ? teacherAhmed.id : teacherSarah.id,
      },
    });
    createdSections.push(secA);

    const secB = await prisma.section.create({
      data: {
        name: 'Section B - Eagle',
        classId: cls.id,
        capacity: 35,
        teacherId: teacherAyesha.id,
      },
    });
    createdSections.push(secB);
  }
  console.log(
    `✅ Created ${createdClasses.length} Classes and ${createdSections.length} Sections`,
  );

  // 7. Core Subjects
  const subjectsData = [
    {
      name: 'Mathematics',
      code: 'MATH-101',
      desc: 'Core Mathematics & Geometry',
    },
    {
      name: 'English Language & Lit',
      code: 'ENG-101',
      desc: 'Grammar, Reading & Composition',
    },
    {
      name: 'General Science',
      code: 'SCI-101',
      desc: 'Physics, Chemistry & Biology Basics',
    },
    {
      name: 'Computer Science',
      code: 'CS-101',
      desc: 'Coding, Algorithms & Information Tech',
    },
    {
      name: 'Urdu & Literature',
      code: 'URD-101',
      desc: 'National Language & Literary Studies',
    },
    {
      name: 'Islamic Studies / Ethics',
      code: 'ISL-101',
      desc: 'Moral & Religious Foundations',
    },
    {
      name: 'Social Studies & History',
      code: 'SST-101',
      desc: 'World Geography & National History',
    },
  ];

  const createdSubjects: Subject[] = [];
  for (const s of subjectsData) {
    const sub = await prisma.subject.create({
      data: {
        name: s.name,
        code: s.code,
        description: s.desc,
        schoolId: school.id,
      },
    });
    createdSubjects.push(sub);

    // Link subject to Grade 9 & 10
    if (createdClasses[8]) {
      await prisma.classSubject.create({
        data: {
          classId: createdClasses[8].id,
          subjectId: sub.id,
          teacherId: teacherSarah.id,
        },
      });
    }
  }

  // 8. Students & Parents
  const parent1 = await prisma.parent.create({
    data: {
      name: 'Mohammad Usman',
      email: 'parent@gmail.com',
      phone: '+92 300 5551234',
      occupation: 'Senior Software Architect',
      relation: 'FATHER',
      address: 'House 42, Block D, Model Town, Lahore',
      schoolId: school.id,
    },
  });

  await prisma.user.create({
    data: {
      name: parent1.name,
      email: parent1.email!,
      passwordHash: parentHash,
      role: 'PARENT',
      schoolId: school.id,
      isActive: true,
      emailVerified: true,
    },
  });

  const student1 = await prisma.student.create({
    data: {
      admissionNo: 'STD-2026-001',
      name: 'Hamza Usman',
      rollNo: '01',
      gender: 'MALE',
      dateOfBirth: new Date('2011-04-14'),
      email: 'student@gmail.com',
      phone: '+92 300 5551234',
      address: 'House 42, Block D, Model Town, Lahore',
      bloodGroup: 'B+',
      religion: 'Islam',
      nationality: 'Pakistani',
      session: '2026-2027',
      bFormNumber: '35201-1234567-1',
      admissionType: 'NEW',
      status: 'ACTIVE',
      isActive: true,
      schoolId: school.id,
      sectionId: createdSections[createdSections.length - 2].id, // Grade 10 Section A
    },
  });

  await prisma.user.create({
    data: {
      name: student1.name,
      email: student1.email!,
      passwordHash: studentHash,
      role: 'STUDENT',
      schoolId: school.id,
      isActive: true,
      emailVerified: true,
    },
  });

  // Link Parent & Student
  await prisma.studentParent.create({
    data: {
      parentId: parent1.id,
      studentId: student1.id,
      isPrimary: true,
    },
  });

  // Add more realistic students
  const sampleStudents = [
    { name: 'Zainab Fatima', roll: '02', gender: 'FEMALE', blood: 'O+' },
    { name: 'Bilal Ahmed', roll: '03', gender: 'MALE', blood: 'A+' },
    { name: 'Areeba Tariq', roll: '04', gender: 'FEMALE', blood: 'AB+' },
    { name: 'Daniyal Hassan', roll: '05', gender: 'MALE', blood: 'B+' },
    { name: 'Maryam Noor', roll: '06', gender: 'FEMALE', blood: 'A-' },
  ];

  for (let i = 0; i < sampleStudents.length; i++) {
    const s = sampleStudents[i];
    await prisma.student.create({
      data: {
        admissionNo: `STD-2026-00${i + 2}`,
        name: s.name,
        rollNo: s.roll,
        gender: s.gender,
        bloodGroup: s.blood,
        dateOfBirth: new Date('2011-06-20'),
        address: 'Gulberg III, Lahore',
        session: '2026-2027',
        status: 'ACTIVE',
        isActive: true,
        schoolId: school.id,
        sectionId: createdSections[createdSections.length - 2].id,
      },
    });
  }
  console.log(`✅ Seeded Students, Parents and User Credentials`);

  // 9. Fee Structures & Payments
  const feeStructure = await prisma.feeStructure.create({
    data: {
      name: 'Monthly Tuition & Laboratory Fee',
      amount: 12500,
      frequency: 'MONTHLY',
      schoolId: school.id,
      classId: createdClasses[8].id,
    },
  });

  await prisma.feePayment.create({
    data: {
      amount: 12500,
      discount: 500,
      fine: 0,
      totalPaid: 12000,
      status: 'PAID',
      method: 'ONLINE',
      paidDate: new Date(),
      schoolId: school.id,
      studentId: student1.id,
      feeStructureId: feeStructure.id,
    },
  });

  // 10. Exams & Exam Results
  const midTermExam = await prisma.exam.create({
    data: {
      name: 'First Term Examination 2026',
      type: 'MIDTERM',
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-22'),
      totalMarks: 100,
      passingMarks: 40,
      schoolId: school.id,
      academicYearId: academicYear.id,
      sectionId: createdSections[createdSections.length - 2].id,
    },
  });

  await prisma.examResult.create({
    data: {
      marksObtained: 92,
      grade: 'A+',
      remarks: 'Outstanding analytical and problem-solving skills.',
      examId: midTermExam.id,
      studentId: student1.id,
      subjectId: createdSubjects[0].id, // Mathematics
    },
  });

  // 11. Buildings & Infrastructure
  await prisma.building.create({
    data: {
      name: 'Ibn-e-Sina Academic Complex',
      buildingType: 'OWNED',
      address: 'Main Boulevard, Gulberg III',
      city: 'Lahore',
      floors: 4,
      totalClassrooms: 24,
      totalRooms: 32,
      studentCapacity: 800,
      hasComputerLab: true,
      hasScienceLab: true,
      hasLibrary: true,
      schoolId: school.id,
      description:
        'Senior academic block equipped with high-tech science and computer laboratories.',
    },
  });

  // 12. Transport Routes & Vehicles
  await prisma.transportRoute.create({
    data: {
      name: 'Route 1: DHA Phase 5 to Main Campus',
      startPoint: 'DHA Phase 5 Commercial',
      endPoint: 'Main School Campus, Gulberg',
      stops: JSON.stringify([
        'Phase 5',
        'LUMS Gate',
        'Cavalry Ground',
        'Main Market',
        'Campus',
      ]),
      distance: 14.5,
      schoolId: school.id,
    },
  });

  // 13. Official Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Academic Session 2026-2027',
      content:
        'We warmly welcome all new and returning students to EduSphere International. Orientation week begins on Monday.',
      targetRoles: 'ALL',
      publishedAt: new Date(),
      schoolId: school.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Parent-Teacher Conference Schedule',
      content:
        'First term PTC meetings will be conducted on Saturday from 9:00 AM to 1:00 PM. Book your slots via the parent portal.',
      targetRoles: 'PARENT',
      publishedAt: new Date(),
      schoolId: school.id,
    },
  });

  // 14. Super Admin platform records for dashboard verification
  await prisma.schoolRequest.createMany({
    data: [
      {
        schoolName: 'Bright Future Academy',
        ownerName: 'Amina Raza',
        email: 'amina@brightfuture.edu',
        phone: '+92 300 1112233',
        city: 'Lahore',
        requestedPlan: 'STANDARD',
        status: 'PENDING',
      },
      {
        schoolName: 'Knowledge Tree School',
        ownerName: 'Usman Ali',
        email: 'usman@knowledgetree.edu',
        phone: '+92 301 4445566',
        city: 'Islamabad',
        requestedPlan: 'BASIC',
        status: 'PENDING',
      },
      {
        schoolName: 'Green Valley College',
        ownerName: 'Sara Khan',
        email: 'sara@greenvalley.edu',
        city: 'Karachi',
        requestedPlan: 'PREMIUM',
        status: 'APPROVED',
        reviewedBy: 'Super Admin',
        reviewedAt: new Date(),
      },
    ],
  });

  await prisma.onboardingPayment.createMany({
    data: [
      {
        schoolId: school.id,
        plan: 'PREMIUM',
        amount: 199,
        method: 'Bank Transfer',
        reference: 'EDU-DEMO-001',
        status: 'PENDING',
      },
      {
        schoolId: school.id,
        plan: 'STANDARD',
        amount: 99,
        method: 'JazzCash',
        reference: 'EDU-DEMO-002',
        status: 'APPROVED',
        reviewedAt: new Date(),
      },
    ],
  });

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNo: 'TK-DEMO-001',
      schoolName: school.name,
      schoolSlug: school.slug,
      senderName: schoolAdmin.name,
      senderEmail: schoolAdmin.email,
      subject: 'Payment gateway setup help',
      message: 'Please help us configure payment gateway settings.',
      category: 'BILLING',
      priority: 'HIGH',
      status: 'OPEN',
    },
  });
  await prisma.ticketReply.create({
    data: {
      ticketId: ticket.id,
      sender: schoolAdmin.name,
      message: ticket.message,
    },
  });

  await prisma.platformAnnouncement.createMany({
    data: [
      {
        title: 'Welcome to EduSphere Platform',
        message: 'Your new school management workspace is ready.',
        target: 'ALL',
        priority: 'NORMAL',
      },
      {
        title: 'Scheduled Maintenance',
        message: 'Platform maintenance is scheduled for Sunday at 2 AM.',
        target: 'ALL',
        priority: 'HIGH',
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'CREATE',
        entity: 'School',
        entityId: school.id,
        after: 'Demo school created',
        userId: superAdmin.id,
        schoolId: school.id,
      },
      {
        action: 'APPROVE',
        entity: 'Payment',
        entityId: 'EDU-DEMO-002',
        after: 'Demo payment approved',
        userId: superAdmin.id,
        schoolId: school.id,
      },
    ],
  });

  console.log('\n✨ Database seeding completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Super Admin : superadmin@gmail.com | 12345678');
  console.log('🏫 School Admin: schooladmin@gmail.com  | 12345678');
  console.log('👩‍🏫 Teacher     : teacher@gmail.com      | teacher123');
  console.log('🎓 Student     : student@gmail.com      | student123');
  console.log('👨‍👩‍👦 Parent      : parent@gmail.com        | parent123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
