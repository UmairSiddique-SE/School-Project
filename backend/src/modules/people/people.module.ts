import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';
import { PlanLimitService } from './plan-limit.service';

@Module({
  controllers: [PeopleController],
  providers: [PeopleService, PlanLimitService],
  exports: [PeopleService, PlanLimitService],
})
export class PeopleModule {}
