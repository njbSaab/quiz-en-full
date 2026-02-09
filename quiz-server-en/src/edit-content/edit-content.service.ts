// src/modules/edit-content/edit-content.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { EditContentQueryService } from './edit-content.query.service';
import { EditContentCommandService } from './edit-content.command.service';
import { EditContentMapper } from './mappers/edit-content.mapper';
import { ContentResponseDto } from './dto/content-response.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { CacheInterceptor } from '../common/interceptors/cache/cache.interceptor';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Edit Content Service
 * 
 * ✅ НОВОЕ: Разделение на публичные и админские методы
 */
@Injectable()
export class EditContentService {
  constructor(
    private readonly queryService: EditContentQueryService,
    private readonly commandService: EditContentCommandService,
    private readonly mapper: EditContentMapper,
    private readonly cacheInterceptor: CacheInterceptor,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(EditContentService.name);
  }

  // ════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЕ МЕТОДЫ (для пользователей)
  // ════════════════════════════════════════════════════════════

  /**
   * Получить все страницы
   */
  async findAll(): Promise<ContentResponseDto[]> {
    this.logger.log('Finding all content');
    const models = await this.queryService.findAll();
    return this.mapper.toResponseArray(models);
  }

  /**
   * Получить страницу по slug (для пользователей)
   */
  async findBySlug(slug: string): Promise<ContentResponseDto> {
    this.logger.log('Finding content by slug (public)', { slug });

    const model = await this.queryService.findBySlug(slug);

    if (!model) {
      this.logger.warn('Content not found', { slug });
      throw new NotFoundException(`Content with slug "${slug}" not found`);
    }

    if (!model.isAvailable()) {
      this.logger.warn('Content not available', { slug });
      throw new NotFoundException(`Content "${slug}" is not available`);
    }

    return this.mapper.toResponse(model);
  }

  // ════════════════════════════════════════════════════════════
  // АДМИНСКИЕ МЕТОДЫ (без кэша, без проверки isActive)
  // ════════════════════════════════════════════════════════════

  /**
   * ✅ НОВОЕ: Получить страницу по ID для админки (БЕЗ кэша)
   * 
   * Используется в админке при редактировании
   * Всегда возвращает актуальные данные из БД
   * НЕ проверяет isActive (админ должен видеть все страницы)
   */
  async findByIdAdmin(id: number): Promise<ContentResponseDto> {
    this.logger.log('Finding content by ID (admin)', { id });

    const model = await this.queryService.findById(id);

    if (!model) {
      this.logger.warn('Content not found', { id });
      throw new NotFoundException(`Content with id ${id} not found`);
    }

    // ✅ НЕ проверяем isActive - админ видит все
    return this.mapper.toResponse(model);
  }

  /**
   * ✅ НОВОЕ: Получить страницу по slug для админки (БЕЗ кэша)
   * 
   * Используется в админке для просмотра
   * Всегда возвращает актуальные данные из БД
   * НЕ проверяет isActive (админ должен видеть все страницы)
   */
  async findBySlugAdmin(slug: string): Promise<ContentResponseDto> {
    this.logger.log('Finding content by slug (admin)', { slug });

    const model = await this.queryService.findBySlugIncludingInactive(slug);

    if (!model) {
      this.logger.warn('Content not found', { slug });
      throw new NotFoundException(`Content with slug "${slug}" not found`);
    }

    // ✅ НЕ проверяем isActive - админ видит все
    return this.mapper.toResponse(model);
  }

  // ════════════════════════════════════════════════════════════
  // ИЗМЕНЕНИЕ ДАННЫХ
  // ════════════════════════════════════════════════════════════

  /**
   * Обновить страницу
   */
  async update(id: number, dto: UpdateContentDto): Promise<ContentResponseDto> {
    this.logger.log('Updating content', { id });

    const existing = await this.queryService.findById(id);
    if (!existing) {
      this.logger.warn('Content not found for update', { id });
      throw new NotFoundException(`Content with id ${id} not found`);
    }

    // Применяем бизнес-логику через модель
    if (dto.title) {
      try {
        existing.updateTitle(dto.title);
      } catch (error) {
        this.logger.error('Invalid title', error.stack, { id, title: dto.title });
        throw error;
      }
    }

    if (dto.content) {
      existing.updateContent(dto.content);
    }

    const updated = await this.commandService.save(existing);

    // ✅ Инвалидируем И список, И конкретную страницу
    await this.cacheInterceptor.invalidateWithList('pages', id);
    
    // Также инвалидируем по slug (если slug может быть в URL)
    if (existing.slug) {
      await this.cacheInterceptor.invalidate(`pages/${existing.slug}`);
    }
    
    this.logger.log('Cache invalidated after content update', { 
      id, 
      slug: existing.slug 
    });

    return this.mapper.toResponse(updated);
  }

  /**
   * Опубликовать страницу
   */
  async publish(id: number): Promise<ContentResponseDto> {
    this.logger.log('Publishing content', { id });

    const model = await this.queryService.findById(id);

    if (!model) {
      throw new NotFoundException(`Content ${id} not found`);
    }

    try {
      model.publish();
    } catch (error) {
      this.logger.error('Cannot publish content', error.stack, { id });
      throw error;
    }

    const published = await this.commandService.save(model);

    // ✅ Инвалидируем И список, И конкретную страницу
    await this.cacheInterceptor.invalidateWithList('pages', id);
    
    if (model.slug) {
      await this.cacheInterceptor.invalidate(`pages/${model.slug}`);
    }
    
    this.logger.log('Content published and cache invalidated', { id });

    return this.mapper.toResponse(published);
  }

  /**
   * Снять с публикации
   */
  async unpublish(id: number): Promise<ContentResponseDto> {
    this.logger.log('Unpublishing content', { id });

    const model = await this.queryService.findById(id);

    if (!model) {
      throw new NotFoundException(`Content ${id} not found`);
    }

    model.unpublish();

    const unpublished = await this.commandService.save(model);

    // ✅ Инвалидируем И список, И конкретную страницу
    await this.cacheInterceptor.invalidateWithList('pages', id);
    
    if (model.slug) {
      await this.cacheInterceptor.invalidate(`pages/${model.slug}`);
    }
    
    this.logger.log('Content unpublished and cache invalidated', { id });

    return this.mapper.toResponse(unpublished);
  }

  // ════════════════════════════════════════════════════════════
  // УТИЛИТЫ
  // ════════════════════════════════════════════════════════════

  /**
   * Получить статистику кэша (для мониторинга)
   */
  async getCacheStats() {
    this.logger.log('Getting cache stats');
    return this.cacheInterceptor.getStats();
  }

  /**
   * Очистить весь кэш вручную (для админов)
   */
  async clearCache(): Promise<void> {
    this.logger.warn('Manually clearing all cache');
    await this.cacheInterceptor.clear();
  }
}