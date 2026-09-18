import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaService } from './media.service';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('image/:category')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
  }))
  async uploadImage(
    @CurrentUser() user: any,
    @Param('category') category: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!user?.schoolId) throw new BadRequestException('A school account is required');
    return this.mediaService.uploadImage(file!, user.schoolId, category);
  }

  @Delete('image')
  async deleteImage(@CurrentUser() user: any) {
    if (!user?.schoolId) throw new BadRequestException('A school account is required');
    return this.mediaService.deleteImageFromBody(user?.bodyPublicId);
  }
}
