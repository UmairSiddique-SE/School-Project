import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PaymentLifecycleService } from './payment-lifecycle.service';
import { PaymentAccountingService } from './payment-accounting.service';
import { PlanCatalogService } from './plan-catalog.service';
import { PlanCatalogController } from './plan-catalog.controller';
import { PrismaService } from '../database/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [AdminService, PaymentLifecycleService, PaymentAccountingService, PlanCatalogService, PrismaService],
  controllers: [AdminController, PlanCatalogController],
  exports: [AdminService, PaymentLifecycleService, PaymentAccountingService, PlanCatalogService],
})
export class AdminModule {}
