import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';

const server: Express = express();
let isInitialized = false;

export async function bootstrapApp() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    {
      bodyParser: false,
    },
  );

  app.use(helmet());

  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOrigins = configuredOrigins.length ? configuredOrigins : '*';

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  isInitialized = true;
  return app;
}

// For Vercel Serverless Function:
export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    await bootstrapApp();
  }
  return server(req, res);
}

// For local / VPS / Docker execution:
if (!process.env.VERCEL) {
  bootstrapApp().then(async (app) => {
    const port = Number(process.env.PORT || 3000);
    await app.listen(port, '0.0.0.0');
    console.log(`Server listening on port ${port}`);
  });
}
