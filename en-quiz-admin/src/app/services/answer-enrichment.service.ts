// src/app/services/answer-enrichment.service.ts
import { Injectable } from '@angular/core';
import { Quiz } from '../interfaces/quiz.interface';

export interface EnrichedAnswer {
  questionId: number;
  answerId: number;
  questionText: string;
  answerText: string;
  isCorrect: boolean;
  points: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnswerEnrichmentService {

  /**
   * Обогащает answers данными из квизов
   * 
   * @param answers - Массив ответов пользователя [{questionId, answerId}, ...]
   * @param quizId - ID квиза
   * @param quizzes - Все квизы с вопросами и ответами
   * @returns Обогащенные answers с текстами и правильностью
   */
  enrichAnswers(
    answers: Array<{ questionId: number; answerId: number }>,
    quizId: number,
    quizzes: Quiz[]
  ): EnrichedAnswer[] {
    // Находим квиз
    const quiz = quizzes.find(q => q.id === quizId);
    
    if (!quiz) {
      console.warn(`Quiz with ID ${quizId} not found`);
      return answers.map(a => ({
        questionId: a.questionId,
        answerId: a.answerId,
        questionText: '',
        answerText: '',
        isCorrect: false,
        points: 0
      }));
    }

    // Обогащаем каждый answer
    return answers.map(userAnswer => {
      // Находим вопрос
      const question = quiz.questions?.find(q => q.id === userAnswer.questionId);
      
      if (!question) {
        console.warn(`Question ${userAnswer.questionId} not found in quiz ${quizId}`);
        return {
          questionId: userAnswer.questionId,
          answerId: userAnswer.answerId,
          questionText: '',
          answerText: '',
          isCorrect: false,
          points: 0
        };
      }

      // Находим ответ
      const answer = question.answers?.find(a => a.id === userAnswer.answerId);
      
      if (!answer) {
        console.warn(`Answer ${userAnswer.answerId} not found for question ${userAnswer.questionId}`);
        return {
          questionId: userAnswer.questionId,
          answerId: userAnswer.answerId,
          questionText: question.text,
          answerText: '',
          isCorrect: false,
          points: 0
        };
      }

      return {
        questionId: userAnswer.questionId,
        answerId: userAnswer.answerId,
        questionText: question.text,
        answerText: answer.text,
        isCorrect: answer.isCorrect,
        points: answer.points
      };
    });
  }

  /**
   * Обогащает все results пользователя
   */
  enrichUserResults(
    results: Array<{
      id: number;
      quizId: number;
      score: number;
      answers: Array<{ questionId: number; answerId: number }>;
      createdAt: string;
    }>,
    quizzes: Quiz[]
  ) {
    return results.map(result => ({
      ...result,
      answers: this.enrichAnswers(result.answers, result.quizId, quizzes)
    }));
  }
}
