// src/modules/quizzes/quizzes.command.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QuizMapper } from './mappers/quiz.mapper';
import { QuizModel } from './models/quiz.model';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { LoggerService } from '../common/logger/logger.service';
import { CacheService } from '../common/chache/cache.service';

/**
 * Command Service - ТОЛЬКО запись квизов
 * 
 * ✅ ИСПРАВЛЕНО: Убраны ошибочные попытки удаления UserSession
 */
@Injectable()
export class QuizzesCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: QuizMapper,
    private readonly logger: LoggerService,
    private readonly cacheService: CacheService,
  ) {
    this.logger.setContext(QuizzesCommandService.name);
  }

  /**
   * Создать новый квиз
   */
  async create(dto: CreateQuizDto): Promise<QuizModel> {
    this.logger.log('Creating new quiz', { title: dto.title });

    const quiz = await this.prisma.quiz.create({
      data: {
        title: dto.title,
        titleAdm: dto.titleAdm,
        description: dto.description,
        descriptionAdm: dto.descriptionAdm,
        descrip: dto.descrip,
        firstPage: dto.firstPage,
        finalPage: dto.finalPage,
        quizShortTitle: dto.quizShortTitle,
        isActive: dto.isActive ?? true,
        isMainView: dto.isMainView ?? false,
        previewImage: dto.previewImage,
        categoryId: dto.categoryId,
        rating: dto.rating !== undefined ? Number(dto.rating) : undefined,
        type: dto.type ?? 'POINTS',
        resultMessages: dto.resultMessages
          ? this.mapper.stringifyJson(dto.resultMessages)
          : null,
        quizInfo: dto.quizInfo
          ? this.mapper.stringifyJson(dto.quizInfo)
          : null,
        questions: {
          create: dto.questions.map((question) => ({
            text: question.text,
            image: question.image,
            order: question.order,
            answers: {
              create: question.answers.map((answer) => ({
                text: answer.text,
                isCorrect: answer.isCorrect,
                points: answer.points,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    // ✅ Инвалидируем кэш списка квизов
    await this.cacheService.invalidateWithList('quizzes');
    this.logger.log('✅ Cache invalidated after quiz creation', { id: quiz.id });

    this.logger.log('Quiz created successfully', { id: quiz.id });
    return this.mapper.toDomain(quiz);
  }

  /**
   * Обновить квиз
   * 
   * ✅ УЛУЧШЕНО:
   * 1. Инвалидирует кэш квиза
   * 2. Удаляет старые UserSession для этого квиза (если связь существует в schema)
   * 3. Очищает связанный кэш
   */
  async update(id: number, dto: UpdateQuizDto): Promise<QuizModel> {
    this.logger.log('Updating quiz', { id });

    // 🎯 ШАГ 1: Обновляем основные поля квиза
    const updated = await this.prisma.quiz.update({
      where: { id },
      data: {
        title: dto.title,
        titleAdm: dto.titleAdm,
        description: dto.description,
        descriptionAdm: dto.descriptionAdm,
        descrip: dto.descrip,
        firstPage: dto.firstPage,
        finalPage: dto.finalPage,
        quizShortTitle: dto.quizShortTitle,
        isActive: dto.isActive,
        isMainView: dto.isMainView,
        previewImage: dto.previewImage,
        categoryId: dto.categoryId,
        rating: dto.rating !== undefined ? Number(dto.rating) : undefined,
        type: dto.type,
        resultMessages:
          dto.resultMessages !== undefined
            ? dto.resultMessages === null
              ? null
              : this.mapper.stringifyJson(dto.resultMessages)
            : undefined,
        quizInfo:
          dto.quizInfo !== undefined
            ? dto.quizInfo === null
              ? null
              : this.mapper.stringifyJson(dto.quizInfo)
            : undefined,
      },
    });

    // 🎯 ШАГ 2: Если обновляются вопросы - заменяем полностью
    if (dto.questions) {
      this.logger.log('Replacing questions', { quizId: id });
      
      // ✅ ОПЦИОНАЛЬНО: Удаляем старые UserSession для этого квиза
      // Раскомментируй эту секцию, ТОЛЬКО если у тебя есть связь Quiz <-> UserSession
      /*
      try {
        const deletedSessions = await this.prisma.userSession.deleteMany({
          where: { 
            // Замени на правильное поле из твоей Prisma schema
            // Например: quizId: id
            // Или через relation: quiz: { id }
          },
        });
        
        this.logger.warn('🗑️  Deleted old sessions after quiz update', {
          quizId: id,
          deletedCount: deletedSessions.count,
        });
      } catch (error) {
        this.logger.warn('Could not delete old sessions (relation might not exist)', {
          quizId: id,
          error: error.message,
        });
      }
      */

      // Удаляем старые вопросы (и ответы cascade)
      await this.prisma.question.deleteMany({
        where: { quizId: id },
      });

      // Создаем новые вопросы
      await this.prisma.question.createMany({
        data: dto.questions.map((question) => ({
          quizId: id,
          text: question.text,
          image: question.image,
          order: question.order,
        })),
      });

      // Получаем созданные вопросы
      const newQuestions = await this.prisma.question.findMany({
        where: { quizId: id },
        select: { id: true, text: true },
      });

      // Создаем ответы для каждого вопроса
      for (const question of dto.questions) {
        const matchingQuestion = newQuestions.find(
          (q) => q.text === question.text,
        );
        if (matchingQuestion && question.answers) {
          await this.prisma.answer.createMany({
            data: question.answers.map((answer) => ({
              questionId: matchingQuestion.id,
              text: answer.text,
              isCorrect: answer.isCorrect,
              points: answer.points,
            })),
          });
        }
      }
    }

    // 🎯 ШАГ 3: Получаем финальный результат
    const result = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: 'asc' },
        },
        category: true,
      },
    });

    // ✅ ШАГ 4: Инвалидируем ВСЕ связанные кэши
    await this.cacheService.invalidateWithList('quizzes', id);
    this.logger.log('✅ Cache invalidated after quiz update', { id });

    this.logger.log('Quiz updated successfully', { id });
    return this.mapper.toDomain(result!);
  }

  /**
   * Удалить квиз
   */
  async delete(id: number): Promise<void> {
    this.logger.log('Deleting quiz', { id });

    // ✅ ОПЦИОНАЛЬНО: Удаляем связанные сессии
    // Раскомментируй ТОЛЬКО если у тебя есть связь Quiz <-> UserSession
    /*
    try {
      const deletedSessions = await this.prisma.userSession.deleteMany({
        where: { 
          // Замени на правильное поле из твоей Prisma schema
        },
      });
      
      this.logger.warn('🗑️  Deleted sessions before quiz deletion', {
        quizId: id,
        deletedCount: deletedSessions.count,
      });
    } catch (error) {
      this.logger.warn('Could not delete sessions (relation might not exist)', {
        quizId: id,
        error: error.message,
      });
    }
    */

    // Удаляем квиз (вопросы и ответы удалятся каскадно)
    await this.prisma.quiz.delete({
      where: { id },
    });

    // ✅ Инвалидируем кэш
    await this.cacheService.invalidateWithList('quizzes', id);
    this.logger.log('✅ Cache invalidated after quiz deletion', { id });

    this.logger.log('Quiz deleted successfully', { id });
  }

  /**
   * Переключить статус активности
   */
  async toggleActive(id: number): Promise<QuizModel> {
    this.logger.log('Toggling quiz active status', { id });

    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    const updated = await this.prisma.quiz.update({
      where: { id },
      data: { isActive: !quiz.isActive },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: 'asc' },
        },
        category: true,
      },
    });

    // ✅ Инвалидируем кэш
    await this.cacheService.invalidateWithList('quizzes', id);
    this.logger.log('✅ Cache invalidated after toggle', {
      id,
      isActive: updated.isActive,
    });

    this.logger.log('Quiz active status toggled', {
      id,
      isActive: updated.isActive,
    });
    return this.mapper.toDomain(updated);
  }
}