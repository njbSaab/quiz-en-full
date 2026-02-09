// src/modules/quizzes/quizzes.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { QuizzesQueryService } from './quizzes.query.service';
import { QuizzesCommandService } from './quizzes.command.service';
import { QuizMapper } from './mappers/quiz.mapper';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';
import { CacheInterceptor } from '../common/interceptors/cache/cache.interceptor';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Quizzes Service - бизнес-логика и оркестрация
 */
@Injectable()
export class QuizzesService {
  constructor(
    private readonly queryService: QuizzesQueryService,
    private readonly commandService: QuizzesCommandService,
    private readonly mapper: QuizMapper,
    private readonly cacheInterceptor: CacheInterceptor,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(QuizzesService.name);
  }

  // ════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЕ МЕТОДЫ (для пользователей)
  // ════════════════════════════════════════════════════════════

  /**
   * Получить все квизы
   */
  async findAll(): Promise<QuizResponseDto[]> {
    this.logger.log('Finding all quizzes');
    const models = await this.queryService.findAll();
    return this.mapper.toResponseArray(models);
  }

  /**
   * Получить активные квизы
   */
  async findActive(): Promise<QuizResponseDto[]> {
    this.logger.log('Finding active quizzes');
    const models = await this.queryService.findActive();
    return this.mapper.toResponseArray(models);
  }

  /**
   * Получить квиз по ID (с перемешанными ответами для игры)
   */
  async findOne(id: number): Promise<QuizResponseDto> {
    this.logger.log('Finding quiz by ID (public)', { id });

    const model = await this.queryService.findById(id);

    if (!model) {
      this.logger.warn('Quiz not found', { id });
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // ✅ Применяем бизнес-логику: перемешиваем ответы ДЛЯ ИГРЫ
    if (model.questions) {
      model.questions.forEach((question) => {
        question.answers = question.shuffleAnswers();
      });
    }

    return this.mapper.toResponse(model);
  }

  /**
   * Получить квизы для главной страницы
   */
  async findForMainPage(): Promise<QuizResponseDto[]> {
    this.logger.log('Finding quizzes for main page');
    const models = await this.queryService.findForMainPage();
    const playableQuizzes = models.filter((quiz) => quiz.canShowOnMain());
    return this.mapper.toResponseArray(playableQuizzes);
  }

  // ════════════════════════════════════════════════════════════
  // АДМИНСКИЕ МЕТОДЫ (без кэша, без перемешивания)
  // ════════════════════════════════════════════════════════════

  /**
   * ✅ НОВОЕ: Получить квиз по ID для админки (БЕЗ перемешивания ответов)
   * 
   * Используется в админке при редактировании
   * Всегда возвращает актуальные данные из БД
   * НЕ перемешивает ответы (нужен оригинальный порядок)
   */
  async findOneAdmin(id: number): Promise<QuizResponseDto> {
    this.logger.log('Finding quiz by ID (admin)', { id });

    const model = await this.queryService.findById(id);

    if (!model) {
      this.logger.warn('Quiz not found', { id });
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // ✅ НЕ перемешиваем ответы - возвращаем как есть
    return this.mapper.toResponse(model);
  }

  // ════════════════════════════════════════════════════════════
  // ИЗМЕНЕНИЕ ДАННЫХ
  // ════════════════════════════════════════════════════════════

  /**
   * Создать новый квиз
   */
  async create(dto: CreateQuizDto): Promise<QuizResponseDto> {
    this.logger.log('Creating new quiz', { title: dto.title });

    const model = await this.commandService.create(dto);

    // ✅ Инвалидируем кэш списка квизов
    await this.cacheInterceptor.invalidate('quizzes');
    this.logger.log('Cache invalidated after quiz creation', { id: model.id });

    return this.mapper.toResponse(model);
  }

  /**
   * Обновить квиз
   */
  async update(id: number, dto: UpdateQuizDto): Promise<QuizResponseDto> {
    this.logger.log('Updating quiz', { id });

    const exists = await this.queryService.exists(id);
    if (!exists) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    const model = await this.commandService.update(id, dto);

    // ✅ Инвалидируем И список, И конкретный квиз
    await this.cacheInterceptor.invalidateWithList('quizzes', id);
    this.logger.log('Cache invalidated after quiz update', { id });

    return this.mapper.toResponse(model);
  }

  /**
   * Удалить квиз
   */
  async remove(id: number): Promise<{ message: string }> {
    this.logger.log('Deleting quiz', { id });

    const exists = await this.queryService.exists(id);
    if (!exists) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    await this.commandService.delete(id);

    // ✅ Инвалидируем И список, И конкретный квиз
    await this.cacheInterceptor.invalidateWithList('quizzes', id);
    this.logger.log('Cache invalidated after quiz deletion', { id });

    return { message: `Quiz with ID ${id} deleted successfully` };
  }

  /**
   * Переключить статус активности
   */
  async toggleActive(id: number): Promise<QuizResponseDto> {
    this.logger.log('Toggling quiz active status', { id });

    const model = await this.queryService.findById(id);
    if (!model) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    try {
      model.toggleActive();
    } catch (error) {
      this.logger.error('Cannot toggle quiz status', error.stack, { id });
      throw error;
    }

    const updated = await this.commandService.toggleActive(id);

    // ✅ Инвалидируем И список, И конкретный квиз
    await this.cacheInterceptor.invalidateWithList('quizzes', id);
    this.logger.log('Quiz active status toggled and cache invalidated', {
      id,
      isActive: updated.isActive,
    });

    return this.mapper.toResponse(updated);
  }

  // ════════════════════════════════════════════════════════════
  // УТИЛИТЫ
  // ════════════════════════════════════════════════════════════

  /**
   * Получить статистику по квизу
   */
  async getStatistics(id: number) {
    this.logger.log('Getting quiz statistics', { id });

    const exists = await this.queryService.exists(id);
    if (!exists) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return this.queryService.getStatistics(id);
  }

  /**
   * Очистить весь кэш квизов
   */
  async clearCache(): Promise<void> {
    this.logger.warn('Manually clearing quizzes cache');
    await this.cacheInterceptor.invalidate('quizzes');
  }

  /**
   * Получить статистику кэша
   */
  async getCacheStats() {
    this.logger.log('Getting cache stats');
    return this.cacheInterceptor.getStats();
  }
}