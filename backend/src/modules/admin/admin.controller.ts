import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, Res, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PaymentLifecycleService } from './payment-lifecycle.service';
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
  constructor(
    private readonly adminService: AdminService,
    private readonly paymentLifecycleService: PaymentLifecycleService,
  ) {}

  @Get('overview')
  async getOverview(): Promise<OverviewDto> { return this.adminService.getOverview(); }

  @Get('plans')
  getPlans() { return this.adminService.getPlans(); }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updatePlan(id, dto);
  }

  @Get('settings')
  getSettings() { return this.adminService.getSettings(); }

  @Post('settings')
  updateSettings(@Body() dto: { updates: { key: string; value: string }[] }) {
    return this.adminService.updateSettings(dto.updates);
  }

  @Patch('settings/:key')
  updateSetting(@Param('key') key: string, @Body() dto: { value: string }) {
    return this.adminService.updateSetting(key, dto.value);
  }

  @Get('email-templates')
  getEmailTemplates() { return this.adminService.getEmailTemplates(); }

  @Post('email-templates')
  createEmailTemplate(@Body() dto: any) { return this.adminService.createEmailTemplate(dto); }

  @Put('email-templates/:id')
  updateEmailTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateEmailTemplate(id, dto);
  }

  @Delete('email-templates/:id')
  deleteEmailTemplate(@Param('id') id: string) {
    return this.adminService.deleteEmailTemplate(id);
  }

  @Get('requests')
  getSchoolRequests(@Query('status') status?: string) {
    return this.adminService.getSchoolRequests(status);
  }

  @Post('requests')
  createSchoolRequest(@Body() dto: any) {
    return this.adminService.createSchoolRequest(dto);
  }

  @Patch('requests/:id/review')
  reviewSchoolRequest(
    @Param('id') id: string,
    @Body() dto: ReviewSchoolRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.reviewSchoolRequest(id, dto.action, dto.reviewNotes, user?.name, user?.id);
  }

  @Get('audit-logs')
  getAuditLogs(
    @Query('action') action?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs(
      action,
      search,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('payments')
  getPayments() { return this.adminService.getPayments(); }

  @Patch('payments/:id/approve')
  approvePayment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentLifecycleService.approvePayment(id, user);
  }

  @Patch('payments/:id/reject')
  rejectPayment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentLifecycleService.rejectPayment(id, user);
  }

  @Get('reports/:id/download')
  @Roles('SUPER_ADMIN')
  async downloadReport(@Param('id') id: string, @Res() res: any) {
    const csv = await this.adminService.getReportCsv(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${id}-${Date.now()}.csv`);
    return res.send(csv);
  }

  @Get('users')
  getUsers(@Query('search') search?: string, @Query('role') role?: string) {
    return this.adminService.getPlatformUsers(search, role);
  }

  @Patch('users/:id/toggle-status')
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Get('support')
  getSupportTickets() { return this.adminService.getSupportTickets(); }

  @Patch('support/:id')
  updateSupportTicket(
    @Param('id') id: string,
    @Body() dto: { status: string; reply?: string },
  ) {
    return this.adminService.updateSupportTicket(id, dto.status, dto.reply);
  }

  @Get('announcements')
  getAnnouncements() { return this.adminService.getAnnouncements(); }

  @Post('announcements')
  createAnnouncement(@Body() dto: { title: string; message: string; target?: string; priority?: string }) {
    return this.adminService.createAnnouncement(dto);
  }
}
