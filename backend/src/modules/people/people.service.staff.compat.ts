import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PeopleService } from './people.service';
import * as bcrypt from 'bcryptjs';

// These methods are implemented as a compatibility extension because the
// Staff module is intentionally kept separate from the Teacher module.
declare module './people.service' {
  interface PeopleService {
    createStaff(schoolId: string, data: any): Promise<any>;
    updateStaff(id: string, schoolId: string, data: any): Promise<any>;
  }
}

// Staff is intentionally separate from Teachers.
// Keep /people/staff limited to the Staff table only.
PeopleService.prototype.getStaff = async function (schoolId: string) {
  const service = this as any;
  if (!schoolId) throw new BadRequestException('School association missing');
  return service.prisma.staff.findMany({
    where: { schoolId, deletedAt: null },
    orderBy: { name: 'asc' },
  });
};

PeopleService.prototype.createStaff = async function (schoolId: string, data: any) {
  const service = this as any;
  if (!schoolId) throw new BadRequestException('School association missing');
  if (String(data?.designation || '').trim().toLowerCase() === 'teacher') {
    throw new BadRequestException('Teachers must be created and managed from the Teachers module');
  }

  const employeeNo = String(data?.employeeNo || '').trim();
  const email = String(data?.email || '').trim().toLowerCase();
  const name = String(data?.name || '').trim();
  const designation = String(data?.designation || '').trim();
  if (!employeeNo || !email || !name || !designation) {
    throw new BadRequestException('Employee No, name, email and designation are required');
  }

  const existingStaff = await service.prisma.staff.findFirst({
    where: { schoolId, OR: [{ employeeNo }, { email }], deletedAt: null },
    select: { id: true },
  });
  if (existingStaff) throw new ConflictException('A staff member with this employee no or email already exists');

  const existingUser = await service.prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) throw new ConflictException('A user with this email already exists');

  const password = String(data?.password || '');
  if (!password || password.length < 12) {
    throw new BadRequestException('A password of at least 12 characters is required');
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await service.prisma.$transaction(async (tx: any) => {
    const staff = await tx.staff.create({
      data: {
        employeeNo,
        name,
        email,
        phone: data?.phone ? String(data.phone).trim() : null,
        designation,
        department: data?.department ? String(data.department).trim() : null,
        salary: data?.salary !== undefined && data.salary !== '' ? Number(data.salary) : null,
        schoolId,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'SCHOOL_ADMIN',
        schoolId,
        phone: data?.phone ? String(data.phone).trim() : null,
        isActive: true,
        emailVerified: true,
        mustChangePassword: false,
      },
      select: { id: true, email: true, name: true },
    });

    return { staff, user };
  });

  return { ...result.staff, credentials: { loginId: result.user.email, password } };
};

PeopleService.prototype.updateStaff = async function (id: string, schoolId: string, data: any) {
  const service = this as any;
  if (!schoolId) throw new BadRequestException('School association missing');
  if (String(data?.designation || '').trim().toLowerCase() === 'teacher') {
    throw new BadRequestException('Teachers must be created and managed from the Teachers module');
  }
  const staff = await service.prisma.staff.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!staff) throw new NotFoundException('Staff member not found');

  const updated = await service.prisma.staff.update({
    where: { id },
    data: {
      name: data?.name ?? undefined,
      phone: data?.phone ?? undefined,
      designation: data?.designation ?? undefined,
      department: data?.department ?? undefined,
      salary: data?.salary !== undefined && data.salary !== '' ? Number(data.salary) : undefined,
      isActive: data?.isActive ?? undefined,
    },
  });

  if (data?.email && String(data.email).trim().toLowerCase() !== staff.email.toLowerCase()) {
    const email = String(data.email).trim().toLowerCase();
    const duplicate = await service.prisma.user.findFirst({ where: { email, schoolId, NOT: { id: staff.id } }, select: { id: true } }).catch(() => null);
    if (duplicate) throw new ConflictException('A user with this email already exists');
    await service.prisma.user.updateMany({ where: { email: staff.email, schoolId }, data: { email } });
    await service.prisma.staff.update({ where: { id }, data: { email } });
  }

  return updated;
};