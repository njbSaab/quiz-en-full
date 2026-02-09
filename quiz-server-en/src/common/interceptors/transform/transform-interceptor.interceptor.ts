// src/common/interceptors/transform.interceptor.ts
import { 
  CallHandler, 
  ExecutionContext, 
  Injectable, 
  NestInterceptor 
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {
    this.loggerService.setContext('Transform');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;

    return next.handle().pipe(
      map(data => {
        const transformed = {
          success: true,
          timestamp: new Date().toISOString(),
          data,
        };
        
        // Логируем только в debug режиме
        this.loggerService.debug('Response transformed', {
          controller: controllerName,
          handler: handlerName,
          method,
          url,
          dataSize: `${JSON.stringify(transformed).length}B`,
        });
        
        return transformed;
      }),
    );
  }
}