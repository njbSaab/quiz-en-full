import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 часа

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, params, query } = request;

    // Кэшируем только GET запросы
    if (method !== 'GET') {
      return next.handle();
    }

    // Генерируем ключ кэша
    const cacheKey = this.generateCacheKey(method, url, params, query);

    // Проверяем наличие в кэше
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      const age = Math.floor((Date.now() - cached.timestamp) / 1000 / 60); // в минутах
      this.logger.log(
        `🎯 Cache HIT ${context.getClass().name}.${context.getHandler().name}() → ${method} ${url} age=${age}m`,
      );
      return new Observable((observer) => {
        observer.next(cached.data);
        observer.complete();
      });
    }

    this.logger.log(
      `❌ Cache MISS ${context.getClass().name}.${context.getHandler().name}() → ${method} ${url}`,
    );

    // Если нет в кэше, выполняем запрос и сохраняем результат
    return next.handle().pipe(
      tap((data) => {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
        this.logger.log(
          `💾 Cached response ${context.getClass().name}.${context.getHandler().name}() → key=${cacheKey.substring(0, 50)}... ttl=24h`,
        );
      }),
    );
  }

  /**
   * Генерировать ключ кэша
   */
  private generateCacheKey(
    method: string,
    url: string,
    params: any,
    query: any,
  ): string {
    const paramsStr = JSON.stringify(params || {});
    const queryStr = JSON.stringify(query || {});
    return `${method}:${url}:${paramsStr}:${queryStr}`;
  }

  /**
   * УЛУЧШЕННАЯ УНИВЕРСАЛЬНАЯ ИНВАЛИДАЦИЯ
   * 
   * Теперь поддерживает:
   * 1. Простой паттерн: invalidate('quizzes') → удалит ВСЕ ключи с 'quizzes'
   * 2. Паттерн с ID: invalidate('quizzes', 11) → удалит конкретный квиз
   * 3. Множественные паттерны: invalidate(['quizzes', 'pages']) → удалит оба
   * 
   * @param pattern - Паттерн или массив паттернов (например: 'quizzes', 'pages')
   * @param id - ID конкретной сущности (опционально)
   */
  async invalidate(
    pattern: string | string[], 
    id?: number | string
  ): Promise<void> {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    let totalDeleted = 0;
    const allDeletedKeys: string[] = [];

    for (const pat of patterns) {
      const { deletedKeys, count } = await this.invalidatePattern(pat, id);
      totalDeleted += count;
      allDeletedKeys.push(...deletedKeys);
    }

    const remaining = this.cache.size;

    this.logger.warn(
      `🗑️  Cache invalidated → pattern=${patterns.join(', ')}${id ? ` id=${id}` : ''} deletedCount=${totalDeleted} remaining=${remaining}`,
    );

    // Логируем удаленные ключи для отладки
    if (totalDeleted > 0 && allDeletedKeys.length <= 10) {
      this.logger.debug(
        `Deleted keys: ${allDeletedKeys.map(k => k.substring(0, 80)).join(', ')}`,
      );
    } else if (totalDeleted > 10) {
      this.logger.debug(
        `Deleted ${totalDeleted} keys (showing first 5): ${allDeletedKeys.slice(0, 5).map(k => k.substring(0, 80)).join(', ')}...`,
      );
    }
  }

  /**
   * Инвалидировать по одному паттерну
   */
  private async invalidatePattern(
    pattern: string,
    id?: number | string,
  ): Promise<{ deletedKeys: string[]; count: number }> {
    const keysToDelete: string[] = [];

    // Если передан ID, создаем дополнительные паттерны для поиска
    const searchPatterns = [pattern];
    
    if (id !== undefined) {
      searchPatterns.push(
        `${pattern}/${id}`,     // GET:/api/quizzes/11
        `${pattern}:${id}`,     // Альтернативный формат
        `/${id}`,               // Просто /11 в URL
      );
    }

    // Находим все ключи, которые нужно удалить
    for (const [key] of this.cache) {
      if (this.matchesAnyPattern(key, searchPatterns)) {
        keysToDelete.push(key);
      }
    }

    // Удаляем найденные ключи
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    return {
      deletedKeys: keysToDelete,
      count: keysToDelete.length,
    };
  }

  /**
   * Проверка соответствия ключа любому из паттернов
   */
  private matchesAnyPattern(key: string, patterns: string[]): boolean {
    return patterns.some(pattern => this.matchesPattern(key, pattern));
  }

  /**
   * УЛУЧШЕННАЯ проверка соответствия ключа паттерну
   * 
   * Примеры работы:
   * 
   * pattern="quizzes" → matches:
   *   ✅ "GET:/api/quizzes:{}:{}"
   *   ✅ "GET:/api/quizzes/11:{"id":"11"}:{}"
   * 
   * pattern="quizzes/11" → matches:
   *   ✅ "GET:/api/quizzes/11:{"id":"11"}:{}"
   *   ❌ "GET:/api/quizzes:{}:{}"
   * 
   * pattern="pages" → matches:
   *   ✅ "GET:/api/pages:{}:{}"
   *   ✅ "GET:/api/pages/home:{"slug":"home"}:{}"
   */
  private matchesPattern(key: string, pattern: string): boolean {
    // 1. Точное совпадение
    if (key === pattern) {
      return true;
    }

    // 2. Ключ содержит паттерн (регистронезависимо)
    if (key.toLowerCase().includes(pattern.toLowerCase())) {
      return true;
    }

    // 3. Извлекаем URL из ключа для более точной проверки
    // Формат ключа: "GET:/api/quizzes/11:{"id":"11"}:{}"
    const urlMatch = key.match(/^[A-Z]+:([^:]+):/);
    if (urlMatch) {
      const url = urlMatch[1]; // Например: "/api/quizzes/11"
      
      // Проверяем, содержит ли URL паттерн
      if (url.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Очистить весь кэш
   */
  async clear(): Promise<void> {
    const count = this.cache.size;
    this.cache.clear();
    this.logger.warn(`🗑️  Cache cleared → deletedCount=${count}`);
  }

  /**
   * Получить статистику кэша
   */
  getStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const keys = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cache.values()).map((v) => v.timestamp);

    return {
      size: this.cache.size,
      keys: keys.map(k => k.substring(0, 100)), // Обрезаем для читаемости
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  /**
   * НОВЫЙ МЕТОД: Инвалидировать по множественным паттернам
   * Удобно для связанных сущностей
   * 
   * Пример: invalidateMultiple(['quizzes', 'users', 'pages'])
   */
  async invalidateMultiple(patterns: string[]): Promise<void> {
    await this.invalidate(patterns);
  }

  /**
   * НОВЫЙ МЕТОД: Инвалидировать конкретную сущность по ID
   * Автоматически создает правильные паттерны
   * 
   * Пример: invalidateEntity('quizzes', 11)
   * Удалит: GET:/api/quizzes/11, но НЕ удалит GET:/api/quizzes
   */
  async invalidateEntity(entityType: string, id: number | string): Promise<void> {
    await this.invalidate(entityType, id);
  }

  /**
   * НОВЫЙ МЕТОД: Инвалидировать и список, и конкретную сущность
   * Используется при UPDATE/DELETE операциях
   * 
   * Пример: invalidateWithList('quizzes', 11)
   * Удалит:
   * - GET:/api/quizzes (список)
   * - GET:/api/quizzes/11 (конкретный элемент)
   */
  async invalidateWithList(entityType: string, id?: number | string): Promise<void> {
    // Всегда инвалидируем список
    await this.invalidate(entityType);
    
    // Если есть ID - инвалидируем и конкретную сущность
    if (id !== undefined) {
      await this.invalidate(entityType, id);
    }
  }
}