import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PaymentLifecycleService } from './payment-lifecycle.service';
import { PaymentAccountingService } from './payment-accounting.service';
import { ManualPaymentService } from './manual-payment.service';
import { SchoolApprovalService } from './school-approval.service';
import { PlanCatalogService } from './plan-catalog.service';
import { PlanCatalogController } from './plan-catalog.controller';
import { SuperAdminSecurityService } from './super-admin-security.service';
import { SchoolRequestDetailService } from './school-request-detail.service';
import { SchoolRequestDetailController } from './school-request-detail.controller';
import { PrismaService } from '../database/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [AdminService, PaymentLifecycleService, PaymentAccountingService, ManualPaymentService, SchoolApprovalService, PlanCatalogService, SuperAdminSecurityService, SchoolRequestDetailService, PrismaService],
  controllers: [AdminController, PlanCatalogController, SchoolRequestDetailController],
  exports: [AdminService, PaymentLifecycleService, PaymentAccountingService, ManualPaymentService, SchoolApprovalService, PlanCatalogService, SuperAdminSecurityService, SchoolRequestDetailService],
})
export class AdminModule {}
