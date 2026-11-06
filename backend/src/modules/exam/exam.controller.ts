import {
  Controller, Get, Post, Put, Patch, Delete, Body, Query, Param, UseGuards,
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

  @Put(':id')
  @Patch(':id')
  @Roles('SCHOOL_ADMIN')
  updateExam(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.examService.updateExam(user.schoolId, id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN')
  deleteExam(@CurrentUser() user: any, @Param('id') id: string) {
    return this.examService.deleteExam(user.schoolId, id);
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
    @Query('subjectId') subjectId?: string,
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

  @Get('analytics/:id')
  @Roles('SCHOOL_ADMIN', 'TEACHER')
  getExamAnalytics(
    @CurrentUser() user: any,
    @Param('id') examId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.examService.getExamAnalytics(user.schoolId, examId, sectionId);
  }

  @Get('report-card/:studentId')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
  getStudentReportCard(
    @CurrentUser() user: any,
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.examService.getStudentReportCard(user.schoolId, studentId, academicYearId);
  }
}
