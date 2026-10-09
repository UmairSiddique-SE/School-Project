import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGatePassDto } from './dto/create-gate-pass.dto';
import { GatePassService } from './gate-pass.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCHOOL_ADMIN')
@Controller('gate-passes')
export class GatePassController {
  constructor(private readonly gatePassService: GatePassService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.gatePassService.list(user?.schoolId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateGatePassDto) {
    if (!user?.id) throw new BadRequestException('Authenticated user is required');
    return this.gatePassService.create(user.schoolId, user.id, dto);
  }

  @Patch(':id/exit')
  markExit(@CurrentUser() user: any, @Param('id') id: string) {
    if (!user?.id) throw new BadRequestException('Authenticated user is required');
    return this.gatePassService.markExit(user.schoolId, user.id, id);
  }
}
