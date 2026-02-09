// src/common/interceptors/logging.interceptor.ts
import { 
  CallHandler, 
  ExecutionContext, 
  Injectable, 
  NestInterceptor 
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {
    this.loggerService.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Логируем входящий запрос
    this.loggerService.log('➡️  Incoming request', {
      method,
      url,
      ip,
      userAgent: userAgent.substring(0, 50), // Обрезаем для читаемости
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const responseSize = data ? JSON.stringify(data).length : 0;
          
          this.loggerService.log('✅ Request completed', {
            method,
            url,
            duration: `${duration}ms`,
            statusCode: 200,
            responseSize: `${responseSize}B`,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          this.loggerService.error(
            '❌ Request failed', 
            error.stack,
            {
              method,
              url,
              duration: `${duration}ms`,
              statusCode: error.status || 500,
              errorMessage: error.message,
              errorName: error.name,
            }
          );
        },
      }),
    );
  }
}