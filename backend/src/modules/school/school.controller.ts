import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get('analytics')
  @Roles('SUPER_ADMIN')
  getAnalytics() {
    return this.schoolService.getSuperAdminAnalytics();
  }

  @Get()
  @Roles('SUPER_ADMIN')
  findAll(@Query() query: any) {
    return this.schoolService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.schoolService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: any) {
    return this.schoolService.create(dto);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.schoolService.update(id, dto);
  }

  @Patch(':id/suspend')
  @Roles('SUPER_ADMIN')
  suspend(@Param('id') id: string) {
    return this.schoolService.suspend(id);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN')
  activate(@Param('id') id: string) {
    return this.schoolService.activate(id);
  }

  @Patch(':id/archive')
  @Roles('SUPER_ADMIN')
  archive(@Param('id') id: string) {
    return this.schoolService.archive(id);
  }

  @Patch(':id/extend-expiry')
  @Roles('SUPER_ADMIN')
  extendExpiry(@Param('id') id: string, @Body() dto: { days: number }) {
    return this.schoolService.extendExpiry(id, dto.days);
  }

  @Patch(':id/change-plan')
  @Roles('SUPER_ADMIN')
  changePlan(@Param('id') id: string, @Body() dto: { plan: string; amount?: number }) {
    return this.schoolService.changePlan(id, dto.plan, dto.amount);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.schoolService.remove(id);
  }
}
