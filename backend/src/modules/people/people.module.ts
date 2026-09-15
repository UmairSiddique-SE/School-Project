import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';
import { StudentBulkController } from './student-bulk.controller';
import { PlanLimitService } from './plan-limit.service';
import './people.service.compat';

@Module({
  controllers: [PeopleController, StudentBulkController],
  providers: [PeopleService, PlanLimitService],
  exports: [PeopleService, PlanLimitService],
})
export class PeopleModule {}
