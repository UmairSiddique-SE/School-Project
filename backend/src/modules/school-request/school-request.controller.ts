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
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.service.findOne(id);
  }
}