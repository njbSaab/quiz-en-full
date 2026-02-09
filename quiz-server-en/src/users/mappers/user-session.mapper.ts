// src/modules/users/mappers/user-session.mapper.ts

import { Injectable } from '@nestjs/common';
import { UserSessionModel } from '../models/user-session.model';

/**
 * Mapper для User Session
 */
@Injectable()
export class UserSessionMapper {
  /**
   * Из Prisma в Domain Model
   */
  toDomain(prismaSession: any): UserSessionModel {
    return new UserSessionModel({
      id: prismaSession.id,
      userId: prismaSession.userId,
      sessionId: prismaSession.sessionId,
      quizId: prismaSession.quizId,
      currentQuestionIndex: prismaSession.currentQuestionIndex,
      correctAnswersCount: prismaSession.correctAnswersCount,
      totalPoints: prismaSession.totalPoints,
      answers: prismaSession.answers || [],
      browserInfo: prismaSession.browserInfo,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,
      user: prismaSession.user,
      quiz: prismaSession.quiz,
    });
  }

  /**
   * Из Domain Model в Response
   */
  toResponse(model: UserSessionModel) {
    return {
      id: model.id,
      userId: model.userId,
      sessionId: model.sessionId,
      quizId: model.quizId,
      currentQuestionIndex: model.currentQuestionIndex,
      correctAnswersCount: model.correctAnswersCount,
      totalPoints: model.totalPoints,
      progress: model.getProgress(),
      isActive: model.isActive(),
      isCompleted: model.isCompleted(),
      canContinue: model.canContinue(),
      ageInMinutes: model.getAgeInMinutes(),
      answersCount: model.answers.length,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }
}