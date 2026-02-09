// src/common/logger/logger.module.ts
import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global() // Делаем модуль глобальным - доступен везде без импорта
@Module({
  providers: [
    LoggerService
  ],
  exports: [LoggerService],
})
export class LoggerModule {}