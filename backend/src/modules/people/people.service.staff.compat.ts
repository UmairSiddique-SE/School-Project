import { BadRequestException } from '@nestjs/common';
import { PeopleService } from './people.service';

// Staff is intentionally separate from Teachers.
// Keep /people/staff limited to the Staff table only.
PeopleService.prototype.getStaff = async function (schoolId: string) {
  const service = this as any;
  return service.prisma.staff.findMany({
    where: { schoolId, deletedAt: null },
    orderBy: { name: 'asc' },
  });
};

const originalCreateStaff = PeopleService.prototype.createStaff;
PeopleService.prototype.createStaff = async function (schoolId: string, data: any) {
  if (String(data?.designation || '').trim().toLowerCase() === 'teacher') {
    throw new BadRequestException('Teachers must be created and managed from the Teachers module');
  }
  return originalCreateStaff.call(this, schoolId, data);
};
