import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse();
      
      if (typeof resContent === 'object' && resContent !== null) {
        message = (resContent as any).message || exception.message;
        errorDetails = (resContent as any).error || null;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // In production, we mask raw database / server errors
      if (process.env.NODE_ENV === 'production') {
        message = 'A database or internal system error occurred';
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Message: ${
        typeof message === 'object' ? JSON.stringify(message) : message
      }`,
      exception instanceof Error ? exception.stack : undefined
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      message: Array.isArray(message) ? message[0] : message,
      error: errorDetails,
      timestamp: new Date().toISOString(),
    });
  }
}
