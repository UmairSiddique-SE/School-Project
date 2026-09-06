import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, Res, UseGuards, BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PaymentLifecycleService } from './payment-lifecycle.service';
import { PaymentAccountingService } from './payment-accounting.service';
import { ManualPaymentService } from './manual-payment.service';
import { SchoolApprovalService } from './school-approval.service';
import { SuperAdminSecurityService } from './super-admin-security.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OverviewDto } from './dto/overview.dto';
import { ReviewSchoolRequestDto } from '../school-request/dto/review-school-request.dto';

@Roles('SUPER_ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  private overviewCache: OverviewDto | null = null;
  private overviewCacheAt = 0;
  private overviewInFlight: Promise<OverviewDto> | null = null;
  private readonly overviewCacheMs = 10000;

  constructor(
    private readonly adminService: AdminService,
    private readonly paymentLifecycleService: PaymentLifecycleService,
    private readonly paymentAccountingService: PaymentAccountingService,
    private readonly manualPaymentService: ManualPaymentService,
    private readonly schoolApprovalService: SchoolApprovalService,
    private readonly superAdminSecurityService: SuperAdminSecurityService,
  ) {}

  @Get('overview')
  async getOverview(): Promise<OverviewDto> {
    const now = Date.now();
    if (this.overviewCache && now - this.overviewCacheAt < this.overviewCacheMs) return this.overviewCache;
    if (!this.overviewInFlight) {
      this.overviewInFlight = this.adminService.getOverview().then((data) => { this.overviewCache = data; this.overviewCacheAt = Date.now(); return data; }).finally(() => { this.overviewInFlight = null; });
    }
    return this.overviewInFlight;
  }

  @Get('payment-accounting')
  getPaymentAccounting() { return this.paymentAccountingService.getSummary(); }

  @Get('plans') getPlans() { return this.adminService.getPlans(); }
  @Put('plans/:id') updatePlan(@Param('id') id: string, @Body() dto: any) { return this.adminService.updatePlan(id, dto); }
  @Get('settings') getSettings() { return this.adminService.getSettings(); }
  @Post('settings') updateSettings(@Body() dto: { updates: { key: string; value: string }[] }) { return this.adminService.updateSettings(dto.updates); }
  @Patch('settings/:key') updateSetting(@Param('key') key: string, @Body() dto: { value: string }) { return this.adminService.updateSetting(key, dto.value); }
  @Get('email-templates') getEmailTemplates() { return this.adminService.getEmailTemplates(); }
  @Post('email-templates') createEmailTemplate(@Body() dto: any) { return this.adminService.createEmailTemplate(dto); }
  @Put('email-templates/:id') updateEmailTemplate(@Param('id') id: string, @Body() dto: any) { return this.adminService.updateEmailTemplate(id, dto); }
  @Delete('email-templates/:id') deleteEmailTemplate(@Param('id') id: string) { return this.adminService.deleteEmailTemplate(id); }
  @Get('requests') getSchoolRequests(@Query('status') status?: string) { return this.adminService.getSchoolRequests(status); }
  @Post('requests') createSchoolRequest(@Body() dto: any) { return this.adminService.createSchoolRequest(dto); }

  @Patch('requests/:id/review')
  reviewSchoolRequest(@Param('id') id: string, @Body() dto: ReviewSchoolRequestDto, @CurrentUser() user: any) {
    return this.schoolApprovalService.review(id, dto.action, dto.reviewNotes, user?.name, user?.id);
  }

  @Get('audit-logs')
  getAuditLogs(@Query('action') action?: string, @Query('search') search?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const parsedPage = page === undefined ? undefined : Number.parseInt(page, 10);
    const parsedLimit = limit === undefined ? undefined : Number.parseInt(limit, 10);
    const invalidPage = page !== undefined && (parsedPage === undefined || !Number.isInteger(parsedPage) || parsedPage < 1);
    const invalidLimit = limit !== undefined && (parsedLimit === undefined || !Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100);
    if (invalidPage || invalidLimit) throw new BadRequestException('Audit log page must be >= 1 and limit must be between 1 and 100.');
    return this.adminService.getAuditLogs(action, search?.trim(), parsedPage, parsedLimit);
  }

  @Get('payments')
  getPayments(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('type') type?: string, @Query('search') search?: string, @Query('date') date?: string) {
    return this.paymentAccountingService.getPayments({ page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined, status, type, search, date });
  }

  @Get('payments/manual-options') getManualPaymentOptions() { return this.manualPaymentService.getOptions(); }
  @Post('payments/manual') createManualPayment(@Body() dto: any, @CurrentUser() user: any) { return this.manualPaymentService.create(dto, user); }
  @Patch('payments/:id/approve') approvePayment(@Param('id') id: string, @CurrentUser() user: any) { return this.paymentLifecycleService.approvePayment(id, user); }
  @Patch('payments/:id/reject') rejectPayment(@Param('id') id: string, @CurrentUser() user: any) { return this.paymentLifecycleService.rejectPayment(id, user); }

  @Get('reports/:id/download')
  async downloadReport(@Param('id') id: string, @Res() res: any) {
    const csv = await this.adminService.getReportCsv(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${id}-${Date.now()}.csv`);
    return res.send(csv);
  }

  @Get('users') getUsers(@Query('search') search?: string, @Query('role') role?: string) { return this.adminService.getPlatformUsers(search, role); }
  @Patch('users/:id/toggle-status') toggleUserStatus(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user?.id) throw new BadRequestException('Authenticated Super Admin context is required.');
    return this.superAdminSecurityService.toggleUserActive(id, user.id);
  }
  @Get('support') getSupportTickets() { return this.adminService.getSupportTickets(); }
  @Patch('support/:id') updateSupportTicket(@Param('id') id: string, @Body() dto: { status: string; reply?: string }) { return this.adminService.updateSupportTicket(id, dto.status, dto.reply); }
  @Get('announcements') getAnnouncements() { return this.adminService.getAnnouncements(); }
  @Post('announcements') createAnnouncement(data: { title: string; message: string; target?: string; priority?: string }) { return this.adminService.createAnnouncement({ ...data, target: data.target || 'ALL' }); }
}
