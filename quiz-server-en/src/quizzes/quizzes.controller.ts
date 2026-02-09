// src/modules/quizzes/quizzes.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SecretWordGuard } from '../utils/guards/secret-word.guard';
import { CacheInterceptor } from '../common/interceptors/cache/cache.interceptor';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Quizzes Controller
 * 
 * ✅ НОВОЕ: Разделение на публичные (с кэшем) и админские (без кэша) роуты
 */
@ApiTags('quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  // ════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЕ РОУТЫ (С КЭШЕМ)
  // ════════════════════════════════════════════════════════════

  /**
   * GET /quizzes - Получить все квизы (С КЭШЕМ)
   */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Получить список всех квизов (кэшируется на 24 часа)' })
  async findAll() {
    return this.quizzesService.findAll();
  }

  /**
   * GET /quizzes/active - Получить активные квизы (С КЭШЕМ)
   */
  @Get('active')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Получить список активных квизов (кэшируется)' })
  async findActive() {
    return this.quizzesService.findActive();
  }

  /**
   * GET /quizzes/main - Получить квизы для главной страницы (С КЭШЕМ)
   */
  @Get('main')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Получить квизы для главной страницы (кэшируется)' })
  async findForMainPage() {
    return this.quizzesService.findForMainPage();
  }

  /**
   * GET /quizzes/:id - Получить квиз по ID (С КЭШЕМ)
   */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Получить квиз по ID (кэшируется)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.findOne(id);
  }

  // ════════════════════════════════════════════════════════════
  // АДМИНСКИЕ РОУТЫ (БЕЗ КЭША) - Всегда свежие данные
  // ════════════════════════════════════════════════════════════

  /**
   * GET /quizzes/admin/all - Получить все квизы (БЕЗ КЭША)
   * 
   * ✅ Для админки - всегда актуальные данные
   * ✅ Требует secret-word
   */
  @Get('admin/all')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ 
    summary: 'Получить все квизы для админки (без кэша)',
    description: 'Всегда возвращает свежие данные из БД. Требует X-Secret-Word заголовок.'
  })
  async findAllAdmin() {
    return this.quizzesService.findAll();
  }

  /**
   * GET /quizzes/admin/:id - Получить квиз по ID (БЕЗ КЭША)
   * 
   * ✅ Для редактирования в админке - всегда актуальные данные
   * ✅ Требует secret-word
   */
  @Get('admin/:id')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ 
    summary: 'Получить квиз по ID для админки (без кэша)',
    description: 'Всегда возвращает свежие данные из БД. Используется при редактировании.'
  })
  async findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.findOneAdmin(id);
  }

  // ════════════════════════════════════════════════════════════
  // УТИЛИТЫ И СТАТИСТИКА
  // ════════════════════════════════════════════════════════════

  /**
   * GET /quizzes/cache/stats - Получить статистику кэша (для отладки)
   */
  @Get('cache/stats')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить статистику кэша' })
  async getCacheStats() {
    return this.quizzesService.getCacheStats();
  }

  /**
   * GET /quizzes/statistics/:id - Получить статистику
   */
  @Get('statistics/:id')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить статистику по квизу' })
  async getStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.getStatistics(id);
  }

  // ════════════════════════════════════════════════════════════
  // ИЗМЕНЕНИЕ ДАННЫХ (POST/PATCH/DELETE)
  // ════════════════════════════════════════════════════════════

  /**
   * POST /quizzes - Создать новый квиз
   */
  @Post()
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Создать новый квиз' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateQuizDto) {
    return this.quizzesService.create(dto);
  }

  /**
   * PATCH /quizzes/:id - Обновить квиз
   */
  @Patch(':id')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Обновить квиз по ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.update(id, dto);
  }

  /**
   * PATCH /quizzes/:id/toggle-active - Переключить статус активности
   */
  @Patch(':id/toggle-active')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Переключить статус активности квиза' })
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.toggleActive(id);
  }

  /**
   * DELETE /quizzes/cache - Очистить весь кэш квизов
   */
  @Delete('cache')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ 
    summary: 'Очистить весь кэш квизов',
    description: 'Удаляет все закэшированные ответы. Автоматически вызывается из админки.'
  })
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    await this.quizzesService.clearCache();
    return {
      success: true,
      message: 'Quizzes cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /quizzes/:id - Удалить квиз
   */
  @Delete(':id')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Удалить квиз по ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.remove(id);
  }
}