// src/app/features/quiz-play/services/quiz-state.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Question } from '../interfaces/quiz.interface';

/**
 * Quiz State Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО управление состоянием квиза в памяти
 * - Реактивное состояние через RxJS
 */
@Injectable()
export class QuizStateService {
  // Состояние
  private currentQuestionIndexSubject = new BehaviorSubject<number>(0);
  private correctAnswersCountSubject = new BehaviorSubject<number>(0);
  private totalPointsSubject = new BehaviorSubject<number>(0);
  private answersSubject = new BehaviorSubject<{ questionId: number; answerId: number | null }[]>([]);
  private isFinishedSubject = new BehaviorSubject<boolean>(false);

  // Публичные observables
  currentQuestionIndex$ = this.currentQuestionIndexSubject.asObservable();
  correctAnswersCount$ = this.correctAnswersCountSubject.asObservable();
  totalPoints$ = this.totalPointsSubject.asObservable();
  answers$ = this.answersSubject.asObservable();
  isFinished$ = this.isFinishedSubject.asObservable();

  private totalQuestions = 0;

  // ────────────────────────────────────────────────────────────
  // ГЕТТЕРЫ
  // ────────────────────────────────────────────────────────────

  get currentQuestionIndex(): number {
    return this.currentQuestionIndexSubject.value;
  }

  get correctAnswersCount(): number {
    return this.correctAnswersCountSubject.value;
  }

  get totalPoints(): number {
    return this.totalPointsSubject.value;
  }

  get answers(): { questionId: number; answerId: number | null }[] {
    return this.answersSubject.value;
  }

  get isFinished(): boolean {
    return this.isFinishedSubject.value;
  }

  // ────────────────────────────────────────────────────────────
  // ИНИЦИАЛИЗАЦИЯ
  // ────────────────────────────────────────────────────────────

  initialize(totalQuestions: number, savedState?: {
    currentQuestionIndex: number;
    correctAnswersCount: number;
    totalPoints: number;
    answers: any[];
  }): void {
    this.totalQuestions = totalQuestions;

    if (savedState) {
      this.currentQuestionIndexSubject.next(savedState.currentQuestionIndex);
      this.correctAnswersCountSubject.next(savedState.correctAnswersCount);
      this.totalPointsSubject.next(savedState.totalPoints);
      this.answersSubject.next(savedState.answers);
      this.isFinishedSubject.next(savedState.currentQuestionIndex >= totalQuestions);
    } else {
      this.reset();
    }
  }

  // ────────────────────────────────────────────────────────────
  // ДЕЙСТВИЯ
  // ────────────────────────────────────────────────────────────

  /**
   * Обработать ответ на вопрос
   */
  processAnswer(question: Question, answer: { id: number; isCorrect: boolean; points: number }): void {
  console.log('🎯 [QuizStateService] Обработка ответа:', {
    questionId: question.id,
    answerId: answer.id,
    isCorrect: answer.isCorrect,
    points: answer.points,
  });

  // Добавляем ответ
  const newAnswers = [...this.answers, {
    questionId: question.id,
    answerId: answer.id,
  }];
  this.answersSubject.next(newAnswers);

  // Обновляем баллы
  if (answer.isCorrect) {
    this.correctAnswersCountSubject.next(this.correctAnswersCount + 1);
    this.totalPointsSubject.next(this.totalPoints + (answer.points || 1));
  }

  console.log('📊 [QuizStateService] Состояние до nextQuestion:', {
    currentIndex: this.currentQuestionIndex,
    totalQuestions: this.totalQuestions,
    answersCount: newAnswers.length,
  });

  // Переходим к следующему вопросу
  this.nextQuestion();
}

/**
 * Перейти к следующему вопросу
 */
private nextQuestion(): void {
  const nextIndex = this.currentQuestionIndex + 1;
  this.currentQuestionIndexSubject.next(nextIndex);

  console.log('➡️ [QuizStateService] Переход к вопросу:', {
    nextIndex,
    totalQuestions: this.totalQuestions,
    isFinished: nextIndex >= this.totalQuestions,
  });

  // Проверяем завершение
  if (nextIndex >= this.totalQuestions) {
    this.isFinishedSubject.next(true);
    console.log('🏁 [QuizStateService] Квиз завершен!');
  }
}


  /**
   * Пропустить вопрос (таймаут)
   */
  skipQuestion(questionId: number): void {
    const newAnswers = [...this.answers, {
      questionId,
      answerId: null,
    }];
    this.answersSubject.next(newAnswers);

    // Переходим к следующему вопросу
    this.nextQuestion();
  }

  /**
   * Сбросить состояние
   */
  reset(): void {
    this.currentQuestionIndexSubject.next(0);
    this.correctAnswersCountSubject.next(0);
    this.totalPointsSubject.next(0);
    this.answersSubject.next([]);
    this.isFinishedSubject.next(false);
  }

  /**
   * Получить текущее состояние для сохранения
   */
  getState(): {
    currentQuestionIndex: number;
    correctAnswersCount: number;
    totalPoints: number;
    answers: any[];
  } {
    return {
      currentQuestionIndex: this.currentQuestionIndex,
      correctAnswersCount: this.correctAnswersCount,
      totalPoints: this.totalPoints,
      answers: this.answers,
    };
  }
}