import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SchoolRequestService } from './school-request.service';

import { CreateSchoolRequestDto } from './dto/create-school-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('school-requests')
export class SchoolRequestController {
  constructor(
    private readonly service: SchoolRequestService,
  ) { }

  @Post()
  create(
    @Body()
    dto: CreateSchoolRequestDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.service.findOne(id);
  }
}