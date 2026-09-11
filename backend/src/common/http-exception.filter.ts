import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = randomUUID();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Never swallow unexpected backend errors. Keep the request id so the
    // same failure can be correlated in the server log.
    if (!(exception instanceof HttpException)) {
      console.error(`\n[HTTP ${status}] ${request.method} ${request.originalUrl} [${requestId}]`);
      console.error(exception);
    }

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error';
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const candidate = (exceptionResponse as { message?: unknown }).message;
      if (typeof candidate === 'string' || Array.isArray(candidate)) {
        message = candidate as string | string[];
      }
    } else if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      // Development only: show the actual exception so local debugging does
      // not get reduced to an unhelpful generic 500 response.
      message = exception.message || message;
    }

    response.setHeader('X-Request-Id', requestId);
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      requestId,
    });
  }
}
