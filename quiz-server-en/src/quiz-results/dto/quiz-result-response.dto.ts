// src/modules/quiz-results/dto/quiz-result-response.dto.ts

import { EnrichedAnswer } from '../models/quiz-result.model';

/**
 * DTO для ответа с результатом квиза
 */
export class QuizResultResponseDto {
  id: number;
  userId: string;
  quizId: number;
  sessionId: string | null;
  score: number;
  correctAnswersCount: number;
  totalQuestions: number;
  accuracyPercentage: number;
  grade: string;
  status: string;
  resultMessage: string;
  answers: EnrichedAnswer[];
  geo: string | null;
  createdAt: string;

  // Дополнительная информация
  user?: {
    name: string | null;
    email: string | null;
  };
  quiz?: {
    title: string;
    type: string;
  };
}