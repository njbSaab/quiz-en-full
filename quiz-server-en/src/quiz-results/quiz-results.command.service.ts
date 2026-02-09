// src/modules/quiz-results/quiz-results.command.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QuizResultModel } from './models/quiz-result.model';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { LoggerService } from '../common/logger/logger.service';
import { UsersCommandService } from '../users/users.command.service';
import { UsersQueryService } from '../users/users.query.service';

/**
 * Quiz Results Command Service
 * 
 * Information Expert (GRASP):
 * - Знает как создавать/обновлять/удалять результаты
 */
@Injectable()
export class QuizResultsCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersCommandService: UsersCommandService,
    private readonly usersQueryService: UsersQueryService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(QuizResultsCommandService.name);
  }

  /**
   * Создать результат квиза
   */
  async create(dto: SubmitQuizDto): Promise<QuizResultModel> {
    this.logger.log('Creating quiz result', {
      quizId: dto.quizId,
      sessionId: dto.sessionId,
    });

    // 🎯 Проверяем, существует ли пользователь
    let user = await this.usersQueryService.findByUuid(dto.userId);

    // 🎯 Если пользователя нет - создаем его автоматически
    if (!user) {
      this.logger.warn('User not found, creating automatically', {
        userId: dto.userId,
      });

      user = await this.usersCommandService.create({
        uuid: dto.userId,
        sessionId: dto.sessionId,
        geo: dto.geo || null,
      });

      this.logger.log('User created automatically', { userId: user.uuid });
    }

    // Проверяем существование квиза
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: dto.quizId },
      include: { questions: true },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${dto.quizId} not found`);
    }

    // Получаем сессию
    const session = await this.prisma.userSession.findUnique({
      where: { sessionId: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Session with ID ${dto.sessionId} not found`,
      );
    }

    // 🎯 Создаем доменную модель
    const model = QuizResultModel.create({
      quizId: dto.quizId,
      userId: user.uuid,
      sessionId: dto.sessionId,
      score: dto.score, // 🎯 Исправлено
      answers: dto.answers || [],
      geo: dto.geo,
      refSource: dto.ref_source, // 🎯 Исправлено: ref_source -> refSource
    });

    // Валидируем ответы
    model.validateAnswers(quiz.questions);

    // 🎯 Сохраняем в БД
    const result = await this.prisma.userResult.create({
      data: {
        quizId: model.quizId,
        userId: model.userId,
        sessionId: model.sessionId,
        score: model.score,
        answers: model.answers as any,
        geo: model.geo,
        refSource: model.refSource, // 🎯 Prisma использует camelCase
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            resultMessages: true,
            questions: true,
          },
        },
      },
    });

    this.logger.log('Quiz result created', { id: result.id });

    return QuizResultModel.fromPrisma(result);
  }

  /**
   * Обновить результат
   */
  async update(
    id: number,
    data: Partial<SubmitQuizDto>,
  ): Promise<QuizResultModel> {
    this.logger.log('Updating quiz result', { id });

    const updated = await this.prisma.userResult.update({
      where: { id },
      data: {
        score: data.score,
        answers: data.answers as any,
        geo: data.geo,
        refSource: data.ref_source, // 🎯 Исправлено
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            resultMessages: true,
            questions: true,
          },
        },
      },
    });

    return QuizResultModel.fromPrisma(updated);
  }

  /**
   * Удалить результат
   */
  async delete(id: number): Promise<void> {
    this.logger.log('Deleting quiz result', { id });

    await this.prisma.userResult.delete({
      where: { id },
    });
  }
}