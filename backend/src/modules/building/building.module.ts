import { Module } from '@nestjs/common';
import { BuildingController } from './building.controller';
import { BuildingService } from './building.service';
import { DatabaseModule } from '../database/database.module';
import { PeopleModule } from '../people/people.module';

@Module({
  imports: [DatabaseModule, PeopleModule],
  controllers: [BuildingController],
  providers: [BuildingService],
  exports: [BuildingService],
})
export class BuildingModule {}
