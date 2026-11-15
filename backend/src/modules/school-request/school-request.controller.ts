import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolRequestService } from './school-request.service';
import { CreateSchoolRequestDto } from './dto/create-school-request.dto';

@Controller('school-requests')
export class SchoolRequestController {
  constructor(private readonly service: SchoolRequestService) {}

  // Public endpoint: prospective schools must be able to submit an application.
  @Post()
  create(@Body() dto: CreateSchoolRequestDto) {
    return this.service.create(dto);
  }

  // Applicant contact details and internal notes are restricted to platform admins.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
