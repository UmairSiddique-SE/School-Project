import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL || '';
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !databaseUrl.toLowerCase().startsWith('postgresql://') && !databaseUrl.toLowerCase().startsWith('postgres://')) {
      throw new Error('Production requires a PostgreSQL DATABASE_URL. SQLite is supported only for local development.');
    }
    if (isProduction) this.logger.log('Production database configuration validated for PostgreSQL.');
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
