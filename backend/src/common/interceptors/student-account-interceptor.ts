import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const formatPhone = (value: unknown) => {
  if (value === undefined || value === null || value === '') return value;
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
};

const formatCnic = (value: unknown) => {
  if (value === undefined || value === null || value === '') return value;
  const digits = String(value).replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

@Injectable()
export class StudentAccountInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<any>();
    const path = String(request.originalUrl || request.url || '').split('?')[0];
    const isStudentEndpoint = /\/people\/students(?:\/[^/]+)?$/.test(path);

    if (isStudentEndpoint && request.body && typeof request.body === 'object') {
      const phoneFields = ['phone', 'studentMobile', 'fatherMobile1', 'fatherWhatsapp', 'motherMobile', 'guardianMobile'];
      for (const field of phoneFields) {
        if (field in request.body) request.body[field] = formatPhone(request.body[field]);
      }
      for (const field of ['bFormNumber', 'fatherCnic']) {
        if (field in request.body) request.body[field] = formatCnic(request.body[field]);
      }
    }

    return next.handle().pipe(
      map((response: any) => {
        if (request.method === 'POST' && /\/people\/students$/.test(path) && response?.student?.admissionNo) {
          return {
            ...response,
            credentials: response.credentials
              ? { ...response.credentials, loginId: `${response.student.admissionNo}@student.edu.pk` }
              : response.credentials,
          };
        }
        return response;
      }),
    );
  }
}
