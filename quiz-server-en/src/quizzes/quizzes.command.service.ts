// src/modules/quizzes/quizzes.command.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QuizMapper } from './mappers/quiz.mapper';
import { QuizModel } from './models/quiz.model';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Command Service - ТОЛЬКО запись квизов
 * 
 * Pure Fabrication (GRASP):
 * - Искусственный класс для изменения данных
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО INSERT/UPDATE/DELETE
 */
@Injectable()
export class QuizzesCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: QuizMapper,
    private readonly logger: LoggerService,
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

    this.logger.log('Quiz created successfully', { id: quiz.id });
    return this.mapper.toDomain(quiz);
  }

  /**
   * Обновить квиз
   */
  async update(id: number, dto: UpdateQuizDto): Promise<QuizModel> {
    this.logger.log('Updating quiz', { id });

    // Обновляем основные поля квиза
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

    // Если обновляются вопросы - заменяем полностью
    if (dto.questions) {
      this.logger.log('Replacing questions', { quizId: id });
      
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

    // Получаем финальный результат
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

    this.logger.log('Quiz updated successfully', { id });
    return this.mapper.toDomain(result!);
  }

  /**
   * Удалить квиз
   */
  async delete(id: number): Promise<void> {
    this.logger.log('Deleting quiz', { id });

    await this.prisma.quiz.delete({
      where: { id },
    });

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

    this.logger.log('Quiz active status toggled', {
      id,
      isActive: updated.isActive,
    });
    return this.mapper.toDomain(updated);
  }
}