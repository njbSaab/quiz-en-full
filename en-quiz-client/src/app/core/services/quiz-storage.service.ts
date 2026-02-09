// src/app/features/quiz-play/services/quiz-storage.service.ts

import { Injectable } from '@angular/core';

/**
 * Quiz Storage Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО работа с localStorage для квизов
 */
@Injectable()
export class QuizStorageService {
  private getKey(quizId: number, key: string): string {
    return `quiz_${quizId}_${key}`;
  }

  // ────────────────────────────────────────────────────────────
  // СОХРАНЕНИЕ
  // ────────────────────────────────────────────────────────────

  saveProgress(quizId: number, data: {
    currentQuestionIndex: number;
    correctAnswersCount: number;
    totalPoints: number;
    answers: any[];
  }): void {
    localStorage.setItem(this.getKey(quizId, 'id'), quizId.toString());
    localStorage.setItem(this.getKey(quizId, 'currentQuestionIndex'), data.currentQuestionIndex.toString());
    localStorage.setItem(this.getKey(quizId, 'correctAnswersCount'), data.correctAnswersCount.toString());
    localStorage.setItem(this.getKey(quizId, 'totalPoints'), data.totalPoints.toString());
    localStorage.setItem(this.getKey(quizId, 'answers'), JSON.stringify(data.answers));
  }

  markCompleted(quizId: number): void {
    localStorage.setItem(this.getKey(quizId, 'completed'), 'true');
  }

  saveFinalResult(quizId: number, result: any): void {
    localStorage.setItem(this.getKey(quizId, 'final_result'), JSON.stringify(result));
  }

  // ────────────────────────────────────────────────────────────
  // ЗАГРУЗКА
  // ────────────────────────────────────────────────────────────

  loadProgress(quizId: number): {
    currentQuestionIndex: number;
    correctAnswersCount: number;
    totalPoints: number;
    answers: any[];
  } | null {
    const storedQuizId = localStorage.getItem(this.getKey(quizId, 'id'));
    
    if (storedQuizId !== quizId.toString()) {
      return null; // Нет сохраненного прогресса
    }

    const index = localStorage.getItem(this.getKey(quizId, 'currentQuestionIndex'));
    const correct = localStorage.getItem(this.getKey(quizId, 'correctAnswersCount'));
    const points = localStorage.getItem(this.getKey(quizId, 'totalPoints'));
    const answers = localStorage.getItem(this.getKey(quizId, 'answers'));

    return {
      currentQuestionIndex: index ? +index : 0,
      correctAnswersCount: correct ? +correct : 0,
      totalPoints: points ? +points : 0,
      answers: answers ? JSON.parse(answers) : [],
    };
  }

  isCompleted(quizId: number): boolean {
    return localStorage.getItem(this.getKey(quizId, 'completed')) === 'true';
  }

  // ────────────────────────────────────────────────────────────
  // ОЧИСТКА
  // ────────────────────────────────────────────────────────────

  clearProgress(quizId: number): void {
    localStorage.removeItem(this.getKey(quizId, 'currentQuestionIndex'));
    localStorage.removeItem(this.getKey(quizId, 'correctAnswersCount'));
    localStorage.removeItem(this.getKey(quizId, 'totalPoints'));
    localStorage.removeItem(this.getKey(quizId, 'answers'));
    localStorage.removeItem(this.getKey(quizId, 'completed'));
  }

  clearAll(quizId: number): void {
    this.clearProgress(quizId);
    localStorage.removeItem(this.getKey(quizId, 'id'));
    localStorage.removeItem(this.getKey(quizId, 'final_result'));
  }
}