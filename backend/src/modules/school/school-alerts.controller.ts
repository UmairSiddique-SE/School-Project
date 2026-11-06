import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SchoolAlertsService, CreateSchoolAlertDto } from './school-alerts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class SchoolAlertsController {
  constructor(private readonly alertsService: SchoolAlertsService) {}

  // -------------------------------------------------------------
  // SUPER ADMIN ENDPOINTS
  // -------------------------------------------------------------

  @Get('schools/alerts/templates')
  @Roles('SUPER_ADMIN')
  getTemplates() {
    return this.alertsService.getTemplates();
  }

  @Get('schools/:schoolId/alerts')
  @Roles('SUPER_ADMIN')
  getSchoolAlerts(@Param('schoolId') schoolId: string) {
    return this.alertsService.getAlertsForSchool(schoolId);
  }

  @Post('schools/:schoolId/alerts')
  @Roles('SUPER_ADMIN')
  createAlert(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateSchoolAlertDto,
    @CurrentUser() user: any,
  ) {
    return this.alertsService.createAlert(schoolId, dto, user);
  }

  @Delete('schools/alerts/:alertId')
  @Roles('SUPER_ADMIN')
  deleteAlert(@Param('alertId') alertId: string, @CurrentUser() user: any) {
    return this.alertsService.deleteAlert(alertId, user);
  }

  @Patch('schools/alerts/:alertId/toggle')
  @Roles('SUPER_ADMIN')
  toggleAlert(
    @Param('alertId') alertId: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() user: any,
  ) {
    return this.alertsService.toggleAlertActive(alertId, isActive, user);
  }

  // -------------------------------------------------------------
  // SCHOOL ADMIN (TENANT) ENDPOINTS
  // -------------------------------------------------------------

  @Get('my-school/alerts')
  @Roles('SCHOOL_ADMIN', 'ADMIN', 'SUPER_ADMIN')
  getMySchoolAlerts(@CurrentUser() user: any) {
    const schoolId = user.schoolId;
    if (!schoolId) return [];
    return this.alertsService.getActiveAlertsForSchool(schoolId);
  }

  @Patch('my-school/alerts/:alertId/dismiss')
  @Roles('SCHOOL_ADMIN', 'ADMIN')
  dismissMyAlert(@Param('alertId') alertId: string, @CurrentUser() user: any) {
    const schoolId = user.schoolId;
    return this.alertsService.dismissAlert(alertId, schoolId);
  }
}
