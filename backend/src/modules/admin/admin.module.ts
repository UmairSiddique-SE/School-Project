import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PaymentLifecycleService } from './payment-lifecycle.service';
import { PrismaService } from '../database/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [AdminService, PaymentLifecycleService, PrismaService],
  controllers: [AdminController],
  exports: [AdminService, PaymentLifecycleService],
})
export class AdminModule {}
