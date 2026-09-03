import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.notificationService.listForUser(user.id, user.schoolId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: any) {
    return this.notificationService.unreadCount(user.id, user.schoolId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationService.markAllRead(user.id, user.schoolId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationService.markRead(user.id, user.schoolId, id);
  }
}
