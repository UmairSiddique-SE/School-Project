import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlanCatalogService } from './plan-catalog.service';

@Roles('SUPER_ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/plan-catalog')
export class PlanCatalogController {
  constructor(private readonly planCatalogService: PlanCatalogService) {}

  @Put(':id')
  updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.planCatalogService.updatePlan(id, data);
  }
}
