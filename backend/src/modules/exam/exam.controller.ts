import {
  Controller, Get, Post, Body, Query, Patch, Param, UseGuards,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  getExams(@CurrentUser() user: any) {
    return this.examService.getExams(user.schoolId, user);
  }

  @Post()
  @Roles('SCHOOL_ADMIN')
  createExam(@CurrentUser() user: any, @Body() dto: any) {
    return this.examService.createExam(user.schoolId, dto);
  }

  @Patch(':id/publish')
  @Roles('SCHOOL_ADMIN')
  publishExam(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const published = dto?.published === undefined ? true : Boolean(dto.published);
    return this.examService.publishExam(user.schoolId, id, published);
  }

  @Get('my-results')
  @Roles('STUDENT')
  getMyResults(@CurrentUser() user: any) {
    return this.examService.getMyResults(user.schoolId, user);
  }

  @Get('results')
  getResults(
    @CurrentUser() user: any,
    @Query('examId') examId: string,
    @Query('subjectId') subjectId: string,
  ) {
    return this.examService.getExamResults(user.schoolId, examId, subjectId, user);
  }

  @Post('results')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  recordResults(@CurrentUser() user: any, @Body() dto: any) {
    return this.examService.recordResults(
      user.schoolId,
      dto,
      user.role === 'TEACHER' ? user.email : undefined,
    );
  }
}
