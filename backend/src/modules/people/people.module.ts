import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';
import { StudentBulkController } from './student-bulk.controller';
import { StudentRecordController } from './student-record.controller';
import { PlanLimitService } from './plan-limit.service';
import './people.service.compat';
import './people.service.staff.compat';

@Module({
  controllers: [PeopleController, StudentBulkController, StudentRecordController],
  providers: [PeopleService, PlanLimitService],
  exports: [PeopleService, PlanLimitService],
})
export class PeopleModule {}
