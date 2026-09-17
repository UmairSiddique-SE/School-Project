import { Module } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { SchoolAlertsService } from './school-alerts.service';
import { SchoolAlertsController } from './school-alerts.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SchoolController, SchoolAlertsController],
  providers: [SchoolService, SchoolAlertsService],
  exports: [SchoolService, SchoolAlertsService],
})
export class SchoolModule {}

