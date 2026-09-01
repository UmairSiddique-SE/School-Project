import { Module } from '@nestjs/common';
import { SchoolRequestController } from './school-request.controller';
import { SchoolRequestService } from './school-request.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SchoolRequestController],
  providers: [SchoolRequestService],
  exports: [SchoolRequestService],
})
export class SchoolRequestModule {}
