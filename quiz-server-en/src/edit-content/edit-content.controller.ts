// src/modules/edit-content/edit-content.controller.ts

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EditContentService } from './edit-content.service';
import { SecretWordGuard } from '../utils/guards/secret-word.guard';
import { UpdateContentDto } from './dto/update-content.dto';
import { CacheInterceptor } from '../common/interceptors/cache/cache.interceptor';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Edit Content Controller
 * 
 * ✅ НОВОЕ: Разделение на публичные (с кэшем) и админские (без кэша) роуты
 */
@ApiTags('pages')
@Controller('pages')
export class EditContentController {
  constructor(private readonly editContentService: EditContentService) {}

  // ════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЕ РОУТЫ (С КЭШЕМ) - для пользователей
  // ════════════════════════════════════════════════════════════

  /**
   * GET /pages - Получить все страницы (С КЭШЕМ)
   * Кэшируется на 24 часа
   */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Получить список всех страниц (кэшируется)' })
  async findAll() {
    return this.editContentService.findAll();
  }

  /**
   * GET /pages/:slug - Получить страницу по slug (С КЭШЕМ)
   * Кэшируется на 24 часа
   */
  @Get(':slug')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Получить страницу по slug (кэшируется)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.editContentService.findBySlug(slug);
  }

  // ════════════════════════════════════════════════════════════
  // АДМИНСКИЕ РОУТЫ (БЕЗ КЭША) - всегда свежие данные
  // ════════════════════════════════════════════════════════════

  /**
   * GET /pages/admin/all - Получить все страницы для админки (БЕЗ КЭША)
   * 
   * ✅ Для админки - всегда актуальные данные
   * ✅ Требует secret-word
   */
  @Get('admin/all')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ 
    summary: 'Получить все страницы для админки (без кэша)',
    description: 'Всегда возвращает свежие данные из БД. Требует X-Secret-Word заголовок.'
  })
  async findAllAdmin() {
    return this.editContentService.findAll();
  }

  /**
   * GET /pages/admin/by-id/:id - Получить страницу по ID для админки (БЕЗ КЭША)
   * 
   * ✅ Для редактирования в админке - всегда актуальные данные
   * ✅ Требует secret-word
   */
  @Get('admin/by-id/:id')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ 
    summary: 'Получить страницу по ID для админки (без кэша)',
    description: 'Всегда возвращает свежие данные из БД. Используется при редактировании.'
  })
  async findByIdAdmin(@Param('id') id: string) {
    return this.editContentService.findByIdAdmin(+id);
  }

  /**
   * GET /pages/admin/by-slug/:slug - Получить страницу по slug для админки (БЕЗ КЭША)
   * 
   * ✅ Для просмотра в админке - всегда актуальные данные
   * ✅ Требует secret-word
   */
  @Get('admin/by-slug/:slug')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ 
    summary: 'Получить страницу по slug для админки (без кэша)',
    description: 'Всегда возвращает свежие данные из БД.'
  })
  async findBySlugAdmin(@Param('slug') slug: string) {
    return this.editContentService.findBySlugAdmin(slug);
  }

  // ════════════════════════════════════════════════════════════
  // УТИЛИТЫ И СТАТИСТИКА
  // ════════════════════════════════════════════════════════════

  /**
   * GET /pages/cache/stats - Получить статистику кэша (для отладки)
   * 
   * ВАЖНО: Должен быть ПЕРЕД /pages/:slug чтобы не конфликтовать
   */
  @Get('cache/stats')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить статистику кэша страниц' })
  async getCacheStats() {
    return this.editContentService.getCacheStats();
  }

  // ════════════════════════════════════════════════════════════
  // ИЗМЕНЕНИЕ ДАННЫХ (PATCH/DELETE)
  // ════════════════════════════════════════════════════════════

  /**
   * PATCH /pages/:id - Обновить страницу
   */
  @Patch(':id')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Обновить страницу по ID' })
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.editContentService.update(+id, dto);
  }

  /**
   * PATCH /pages/:id/publish - Опубликовать страницу
   */
  @Patch(':id/publish')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Опубликовать страницу' })
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string) {
    return this.editContentService.publish(+id);
  }

  /**
   * PATCH /pages/:id/unpublish - Снять с публикации
   */
  @Patch(':id/unpublish')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Снять страницу с публикации' })
  @HttpCode(HttpStatus.OK)
  async unpublish(@Param('id') id: string) {
    return this.editContentService.unpublish(+id);
  }

  /**
   * DELETE /pages/cache - Очистить весь кэш страниц
   * 
   * ВАЖНО: 
   * 1. Должен быть ПЕРЕД /pages/:slug чтобы не конфликтовать
   * 2. Вызывается автоматически из Angular после изменений
   * 3. Также можно вызвать вручную для принудительной очистки
   */
  @Delete('cache')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ 
    summary: 'Очистить весь кэш страниц',
    description: 'Удаляет все закэшированные страницы. Автоматически вызывается из админки.'
  })
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    await this.editContentService.clearCache();
    return {
      success: true,
      message: 'Pages cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }
}