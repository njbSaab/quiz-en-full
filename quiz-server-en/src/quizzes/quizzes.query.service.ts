// src/modules/quizzes/quizzes.query.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QuizMapper } from './mappers/quiz.mapper';
import { QuizModel } from './models/quiz.model';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Query Service - ТОЛЬКО чтение квизов
 * 
 * Pure Fabrication (GRASP):
 * - Искусственный класс для работы с данными
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО SELECT запросы
 */
@Injectable()
export class QuizzesQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: QuizMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(QuizzesQueryService.name);
  }

  /**
   * Найти все квизы
   */
  async findAll(): Promise<QuizModel[]> {
    this.logger.log('Fetching all quizzes');

    const quizzes = await this.prisma.quiz.findMany({
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: 'asc' },
        },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map(quiz => this.mapper.toDomain(quiz));
  }

  /**
   * Найти активные квизы
   */
  async findActive(): Promise<QuizModel[]> {
    this.logger.log('Fetching active quizzes');

    const quizzes = await this.prisma.quiz.findMany({
      where: { isActive: true },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: 'asc' },
        },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map(quiz => this.mapper.toDomain(quiz));
  }

  /**
   * Найти квиз по ID
   */
  async findById(id: number): Promise<QuizModel | null> {
    this.logger.log('Fetching quiz by ID', { id });

    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: 'asc' },
        },
        category: true,
      },
    });

    return quiz ? this.mapper.toDomain(quiz) : null;
  }

  /**
   * Найти квизы для главной страницы
   */
  async findForMainPage(): Promise<QuizModel[]> {
    this.logger.log('Fetching quizzes for main page');

    const quizzes = await this.prisma.quiz.findMany({
      where: {
        isActive: true,
        isMainView: true,
      },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: 'asc' },
        },
        category: true,
      },
      orderBy: { rating: 'desc' },
      take: 10,
    });

    return quizzes.map(quiz => this.mapper.toDomain(quiz));
  }

  /**
   * Проверить существование квиза
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.quiz.count({
      where: { id },
    });

    return count > 0;
  }

  /**
   * Получить статистику по квизу
   */
  async getStatistics(quizId: number) {
    this.logger.log('Fetching quiz statistics', { quizId });

    const results = await this.prisma.userResult.findMany({
      where: { quizId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalUsers = results.length;
    const averageScore = totalUsers
      ? results.reduce((sum, r) => sum + r.score, 0) / totalUsers
      : 0;

    return {
      totalUsers,
      averageScore,
      results: results.map(r => ({
        userName: r.user?.name ?? 'Anonymous',
        score: r.score,
        answers: r.answers,
        createdAt: r.createdAt,
      })),
    };
  }
}