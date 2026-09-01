import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { DatabaseModule } from '../database/database.module';
import { TenantMiddleware } from '../../common/middleware/tenant.middleware';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply TenantMiddleware to all /public/tenant/* routes
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: 'public/tenant/*path', method: RequestMethod.ALL });
  }
}
