import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OnboardingStatusService } from './onboarding-status.service';

@ApiTags('Authentication')
@Controller('auth/onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingStatusController {
  constructor(private readonly onboardingStatusService: OnboardingStatusService) {}

  @Get('status')
  getStatus(@CurrentUser() user: any) {
    return this.onboardingStatusService.getStatus(user);
  }
}
