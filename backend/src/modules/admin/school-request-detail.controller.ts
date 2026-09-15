import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolRequestDetailService } from './school-request-detail.service';

@Roles('SUPER_ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/requests')
export class SchoolRequestDetailController {
  constructor(private readonly detailService: SchoolRequestDetailService) {}

  @Get(':id/details')
  getDetails(@Param('id') id: string) {
    return this.detailService.getById(id);
  }
}
