import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EditContentService } from './edit-content.service';
import { EditContentController } from './edit-content.controller';
import { CacheInterceptor } from '../common/interceptors/cache/cache.interceptor';
import { EditContentQueryService } from './edit-content.query.service';
import { EditContentCommandService } from './edit-content.command.service';
import { EditContentMapper } from './mappers/edit-content.mapper';
import { CacheService } from '../common/chache/cache.service';

@Module({
  controllers: [EditContentController],
  providers: [
    // Основной сервис (оркестрация)
    EditContentService,
    
    // 🎯 Сервисы доступа к данным (ОБЯЗАТЕЛЬНО добавить!)
    EditContentQueryService,    // Чтение из БД
    EditContentCommandService,  // Запись в БД
    
    // Вспомогательные сервисы
    EditContentMapper,          // Преобразование данных
    PrismaService,              // ORM
    CacheInterceptor,           // Кэширование
  ],
  exports: [EditContentService],
})
export class EditContent {}