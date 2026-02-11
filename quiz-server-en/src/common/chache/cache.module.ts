// src/common/cache/cache.module.ts

import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      ttl: 60_000,
      max: 500,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}