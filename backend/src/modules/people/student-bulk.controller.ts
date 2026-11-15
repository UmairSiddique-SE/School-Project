import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PeopleService } from './people.service';
import { PlanLimitService } from './plan-limit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('people/students')
export class StudentBulkController {
  constructor(
    private readonly peopleService: PeopleService,
    private readonly planLimitService: PlanLimitService,
  ) {}

  @Post('import')
  @Roles('SCHOOL_ADMIN')
  async importStudents(@CurrentUser() user: any, @Body() dto: any) {
    const rows = Array.isArray(dto?.students) ? dto.students : [];
    if (!rows.length) throw new BadRequestException('At least one student record is required');
    if (rows.length > 500) throw new BadRequestException('A maximum of 500 students can be imported at once');
    if (!user?.schoolId) throw new BadRequestException('School association is missing');

    const results: any[] = [];
    for (const row of rows) {
      await this.planLimitService.assertStudentCapacity(user.schoolId);
      if (!row?.name || !row?.sectionId || !row?.fatherName || !row?.fatherMobile1 || !row?.address) {
        throw new BadRequestException('Each imported student requires name, sectionId, fatherName, fatherMobile1 and address');
      }
      results.push(await this.peopleService.createStudent(user.schoolId, {
        ...row,
        parentPassword: row.parentPassword,
      }));
    }

    return { imported: results.length, students: results };
  }
}
