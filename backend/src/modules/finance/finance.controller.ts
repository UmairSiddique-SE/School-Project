import {
  Controller, Get, Post, Body, UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('structures')
  @Roles('SCHOOL_ADMIN', 'STUDENT', 'PARENT')
  getStructures(@CurrentUser() user: any) {
    return this.financeService.getFeeStructures(user.schoolId);
  }

  @Post('structures')
  @Roles('SCHOOL_ADMIN')
  createStructure(@CurrentUser() user: any, @Body() dto: any) {
    return this.financeService.createFeeStructure(user.schoolId, dto);
  }

  @Get('payments')
  @Roles('SCHOOL_ADMIN', 'STUDENT', 'PARENT')
  getPayments(@CurrentUser() user: any) {
    return this.financeService.getPaymentsForUser(user);
  }

  @Post('payments')
  @Roles('SCHOOL_ADMIN')
  collectFee(@CurrentUser() user: any, @Body() dto: any) {
    return this.financeService.collectFee(user.schoolId, dto);
  }
}
