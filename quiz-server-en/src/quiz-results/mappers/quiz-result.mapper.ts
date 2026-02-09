// src/modules/quiz-results/mappers/quiz-result.mapper.ts

import { Injectable } from '@nestjs/common';
import { QuizResultModel } from '../models/quiz-result.model';
import { QuizResultResponseDto } from '../dto/quiz-result-response.dto';

/**
 * Mapper для преобразования Quiz Result
 * 
 * Information Expert (GRASP):
 * - Знает как конвертировать Prisma → Model → DTO
 */
@Injectable()
export class QuizResultMapper {
  /**
   * Из Prisma в Domain Model
   */
  toDomain(prismaResult: any): QuizResultModel {
    return new QuizResultModel({
      id: prismaResult.id,
      userId: prismaResult.userId,
      quizId: prismaResult.quizId,
      sessionId: prismaResult.sessionId,
      score: prismaResult.score,
      answers: prismaResult.answers || [],
      geo: prismaResult.geo,
      createdAt: prismaResult.createdAt,
      user: prismaResult.user,
      quiz: prismaResult.quiz,
    });
  }

  /**
   * Из Domain Model в Response DTO
   */
  toResponse(
    model: QuizResultModel,
    quizResultMessages?: Record<string, string>,
  ): QuizResultResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      quizId: model.quizId,
      sessionId: model.sessionId,
      score: model.score,
      correctAnswersCount: model.getCorrectAnswersCount(),
      totalQuestions: model.getTotalQuestions(),
      accuracyPercentage: model.getAccuracyPercentage(),
      grade: model.getGrade(),
      status: model.getStatus(),
      resultMessage: model.getResultMessage(quizResultMessages),
      answers: model.answers,
      geo: model.geo,
      createdAt: model.createdAt.toISOString(),
      user: model.user
        ? {
            name: model.user.name,
            email: model.user.email,
          }
        : undefined,
      quiz: model.quiz
        ? {
            title: model.quiz.title,
            type: model.quiz.type,
          }
        : undefined,
    };
  }

  /**
   * Массив моделей в массив DTO
   */
  toResponseArray(
    models: QuizResultModel[],
    quizResultMessages?: Record<string, string>,
  ): QuizResultResponseDto[] {
    return models.map((model) => this.toResponse(model, quizResultMessages));
  }
}