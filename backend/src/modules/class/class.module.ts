import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { AcademicsService } from './academics.service';
import { AcademicsController } from './academics.controller';

@Module({
  controllers: [ClassController, AcademicsController],
  providers: [ClassService, AcademicsService],
  exports: [ClassService, AcademicsService],
})
export class ClassModule {}

