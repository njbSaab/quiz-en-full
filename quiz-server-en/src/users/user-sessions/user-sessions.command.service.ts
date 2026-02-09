// src/modules/users/user-sessions/user-sessions.command.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UserSessionMapper } from '../mappers/user-session.mapper';
import { UserSessionModel } from '../models/user-session.model';
import { UserSessionDataDto } from '../dto/user-session-data.dto';
import { LoggerService } from '../../common/logger/logger.service';
import { randomUUID } from 'crypto';

/**
 * User Sessions Command Service - ТОЛЬКО запись
 */
@Injectable()
export class UserSessionsCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserSessionMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(UserSessionsCommandService.name);
  }

  /**
   * Сохранить или обновить сессию
   */
  async saveSession(
    sessionData: UserSessionDataDto,
  ): Promise<{ session: UserSessionModel; userId: string }> {
    this.logger.log('Saving user session', {
      sessionId: sessionData.sessionId || 'new',
    });

    // 1. Обогащаем ответы данными из квиза (если есть quizId)
    let enrichedAnswers: any[] = [];

    if (sessionData.quizId && sessionData.quizId !== 0) {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: sessionData.quizId },
        include: { questions: { include: { answers: true } } },
      });

      if (!quiz) {
        throw new NotFoundException(
          `Quiz with ID ${sessionData.quizId} not found`,
        );
      }

      enrichedAnswers = sessionData.answers.map((userAnswer: any) => {
        const question = quiz.questions.find(
          (q) => q.id === userAnswer.questionId,
        );
        const answer = question?.answers.find(
          (a) => a.id === userAnswer.answerId,
        );

        return {
          questionId: userAnswer.questionId,
          answerId: userAnswer.answerId,
          questionText: question?.text || '',
          answerText: answer?.text || '',
          isCorrect: answer?.isCorrect || false,
          points: answer?.points || 0,
        };
      });
    } else {
      enrichedAnswers = sessionData.answers || [];
    }

    // 2. Определяем sessionId и userId
    const sessionId = sessionData.sessionId || randomUUID();
    let userId = sessionData.userId;

    // 3. Проверяем существующую сессию
    const existingSession = await this.prisma.userSession.findFirst({
      where: { sessionId },
    });

    if (existingSession && existingSession.userId) {
      userId = existingSession.userId;
      this.logger.log('Using existing user from session', { userId });
    } else if (userId) {
      // Проверяем существование пользователя
      const user = await this.prisma.user.findUnique({
        where: { uuid: userId },
      });

      if (!user) {
        this.logger.warn('User not found, creating new', { userId });
        const newUser = await this.prisma.user.create({
          data: {
            uuid: randomUUID(),
            name: null,
            email: null,
          },
        });
        userId = newUser.uuid;
      }
    } else {
      // Создаем нового анонимного пользователя
      const user = await this.prisma.user.create({
        data: {
          uuid: randomUUID(),
          name: null,
          email: null,
        },
      });
      userId = user.uuid;
      this.logger.log('Created new anonymous user', { userId });
    }

    // 4. Сериализуем browserInfo
    const browserInfo = sessionData.browserInfo
      ? JSON.parse(JSON.stringify(sessionData.browserInfo))
      : null;

    // 5. Сохраняем или обновляем сессию
    let session;
    if (existingSession) {
      session = await this.prisma.userSession.update({
        where: { id: existingSession.id },
        data: {
          quizId: sessionData.quizId === 0 ? null : sessionData.quizId,
          userId,
          currentQuestionIndex: sessionData.currentQuestionIndex,
          correctAnswersCount: sessionData.correctAnswersCount,
          totalPoints: sessionData.totalPoints,
          answers: enrichedAnswers,
          browserInfo,
          updatedAt: new Date(),
        },
        include: { quiz: true },
      });
      this.logger.log('Session updated', { sessionId, userId });
    } else {
      session = await this.prisma.userSession.create({
        data: {
          quizId: sessionData.quizId === 0 ? null : sessionData.quizId,
          userId,
          sessionId,
          currentQuestionIndex: sessionData.currentQuestionIndex,
          correctAnswersCount: sessionData.correctAnswersCount,
          totalPoints: sessionData.totalPoints,
          answers: enrichedAnswers,
          browserInfo,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: { quiz: true },
      });
      this.logger.log('Session created', { sessionId, userId });
    }

    return {
      session: this.mapper.toDomain(session),
      userId,
    };
  }

  /**
   * Удалить сессии по sessionId
   */
  async deleteBySessionId(sessionId: string): Promise<number> {
    this.logger.log('Deleting sessions', { sessionId });

    const result = await this.prisma.userSession.deleteMany({
      where: { sessionId },
    });

    this.logger.log('Sessions deleted', {
      sessionId,
      count: result.count,
    });

    return result.count;
  }
}