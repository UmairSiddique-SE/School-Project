import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

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
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.service.findOne(id);
  }
}