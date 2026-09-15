import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
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
  @Roles('SCHOOL_ADMIN', 'STUDENT')
  getStructures(@CurrentUser() user: any) {
    return this.financeService.getFeeStructures(user.schoolId, user);
  }

  @Post('structures')
  @Roles('SCHOOL_ADMIN')
  createStructure(@CurrentUser() user: any, @Body() dto: any) {
    return this.financeService.createFeeStructure(user.schoolId, dto);
  }

  @Get('payments')
  @Roles('SCHOOL_ADMIN', 'STUDENT')
  getPayments(@CurrentUser() user: any) {
    return this.financeService.getPaymentsForUser(user);
  }

  @Post('payments')
  @Roles('SCHOOL_ADMIN')
  collectFee(@CurrentUser() user: any, @Body() dto: any) {
    return this.financeService.collectFee(user.schoolId, dto);
  }

  @Get('accounts')
  @Roles('SCHOOL_ADMIN')
  getAccounts(@CurrentUser() user: any, @Query() query: any) {
    return this.financeService.getAccountEntries(user.schoolId, query);
  }

  @Post('accounts')
  @Roles('SCHOOL_ADMIN')
  createAccount(@CurrentUser() user: any, @Body() dto: any) {
    return this.financeService.createAccountEntry(user.schoolId, dto);
  }

  @Get('summary')
  @Roles('SCHOOL_ADMIN')
  getSummary(@CurrentUser() user: any, @Query() query: any) {
    return this.financeService.getFinanceSummary(user.schoolId, query);
  }
}
