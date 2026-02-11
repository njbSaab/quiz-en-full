// src/modules/common/interceptors/cache/cache.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../../chache/cache.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Кэшируем только GET
    if (request.method !== 'GET') {
      return next.handle();
    }

    const key = this.buildKey(request);
    const cached = await this.cacheService.get(key);

    if (cached) {
      return of(cached); // Возвращаем из кэша
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(key, response, 60_000); // TTL 60с
      }),
    );
  }

  private buildKey(request: any): string {
    // url уже содержит path + query params
    return `cache:${request.url}`;
  }
}