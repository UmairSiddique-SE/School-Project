import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      transactionOptions: {
        maxWait: 15000,
        timeout: 60000,
      },
    });
  }

  async onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL || '';
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !databaseUrl.toLowerCase().startsWith('postgresql://') && !databaseUrl.toLowerCase().startsWith('postgres://')) {
      throw new Error('Production requires a PostgreSQL DATABASE_URL. SQLite is supported only for local development.');
    }
    if (isProduction) this.logger.log('Production database configuration validated for PostgreSQL.');

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Connecting to database (attempt ${attempt}/${maxRetries})...`);
        await this.$connect();
        this.logger.log('Successfully connected to database.');
        break;
      } catch (error) {
        this.logger.warn(`Database connection attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
