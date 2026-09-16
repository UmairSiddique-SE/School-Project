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
