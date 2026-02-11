// src/modules/common/cache/cache.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(CacheService.name);
  }

  /** Получить значение */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  /** Записать значение */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.cache.set(key, value, ttlMs);
  }

  /** Удалить один ключ */
  async invalidate(key: string): Promise<void> {
    await this.cache.del(key);
    this.logger.log(`Cache invalidated: ${key}`);
  }

  /** Удалить ключ списка + ключ конкретной записи */
  async invalidateWithList(listKey: string, id?: number | string): Promise<void> {
    if (id !== undefined) {
      await Promise.all([
        this.cache.del(listKey),           // "quizzes"
        this.cache.del(`${listKey}/${id}`), // "quizzes/123"
      ]);
      this.logger.log(`Cache invalidated: ${listKey}, ${listKey}/${id}`);
    } else {
      await this.cache.del(listKey);
      this.logger.log(`Cache invalidated: ${listKey}`);
    }
  }

  /** Очистить весь кэш */
  async clear(): Promise<void> {
    if (this.cache.stores) {
      for (const store of this.cache.stores) {
        if (store && typeof store.clear === 'function') {
          await store.clear();
        }
      }
    }
    this.logger.log('Cache fully cleared');
  }

  /** Статистика (если нужна) */
  getStats() {
    const store = this.cache.stores ? this.cache.stores[0] : null;
    return {
      // зависит от store — для memory-store можно вернуть keys
      storeType: (store as any)?.name ?? 'unknown',
    };
  }
}