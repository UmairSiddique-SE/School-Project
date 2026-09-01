import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../database/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [AdminService, PrismaService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
