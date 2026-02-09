// src/modules/quiz-results/quiz-results.query.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QuizResultMapper } from './mappers/quiz-result.mapper';
import { QuizResultModel } from './models/quiz-result.model';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Query Service - ТОЛЬКО чтение результатов
 */
@Injectable()
export class QuizResultsQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: QuizResultMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(QuizResultsQueryService.name);
  }

  /**
   * Найти результаты по квизу
   */
  async findByQuizId(quizId: number): Promise<QuizResultModel[]> {
    this.logger.log('Finding results by quiz ID', { quizId });

    const results = await this.prisma.userResult.findMany({
      where: { quizId },
      include: {
        user: true,
        quiz: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapper.toDomain(r));
  }

  /**
   * Найти результаты по пользователю
   */
  async findByUserId(userId: string): Promise<QuizResultModel[]> {
    this.logger.log('Finding results by user ID', { userId });

    const results = await this.prisma.userResult.findMany({
      where: { userId },
      include: {
        user: true,
        quiz: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapper.toDomain(r));
  }

  /**
   * Найти результат по ID
   */
  async findById(id: number): Promise<QuizResultModel | null> {
    this.logger.log('Finding result by ID', { id });

    const result = await this.prisma.userResult.findUnique({
      where: { id },
      include: {
        user: true,
        quiz: true,
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  /**
   * Найти результат по сессии и квизу
   */
  async findBySessionAndQuiz(
    sessionId: string,
    quizId: number,
  ): Promise<QuizResultModel | null> {
    this.logger.log('Finding result by session and quiz', {
      sessionId,
      quizId,
    });

    const result = await this.prisma.userResult.findFirst({
      where: {
        sessionId,
        quizId,
      },
      include: {
        user: true,
        quiz: true,
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  /**
   * Получить статистику по квизу
   */
  async getQuizStatistics(quizId: number) {
    this.logger.log('Getting quiz statistics', { quizId });

    const results = await this.findByQuizId(quizId);

    const totalUsers = results.length;
    const averageScore =
      totalUsers > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / totalUsers
        : 0;
    const averageAccuracy =
      totalUsers > 0
        ? results.reduce((sum, r) => sum + r.getAccuracyPercentage(), 0) /
          totalUsers
        : 0;

    return {
      totalUsers,
      averageScore: Math.round(averageScore * 100) / 100,
      averageAccuracy: Math.round(averageAccuracy),
      results: results.map((r) => ({
        userName: r.user?.name ?? 'Anonymous',
        score: r.score,
        accuracyPercentage: r.getAccuracyPercentage(),
        grade: r.getGrade(),
        createdAt: r.createdAt,
      })),
    };
  }
}