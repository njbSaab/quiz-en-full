// src/modules/users/models/user-session.model.ts

/**
 * Доменная модель User Session
 * 
 * Information Expert (GRASP):
 * - Знает о структуре сессии
 * - Содержит бизнес-правила сессии
 */
export class UserSessionModel {
  id: number;
  userId: string;
  sessionId: string;
  quizId: number | null;
  currentQuestionIndex: number;
  correctAnswersCount: number;
  totalPoints: number;
  answers: any[];
  browserInfo: any;
  createdAt: Date;
  updatedAt: Date;

  // Связи
  user?: any;
  quiz?: any;

  constructor(data: Partial<UserSessionModel>) {
    Object.assign(this, data);
  }

  // ────────────────────────────────────────────────────────────
  // Бизнес-методы
  // ────────────────────────────────────────────────────────────

  /**
   * Сессия активна (обновлялась недавно)
   */
  isActive(): boolean {
    const now = new Date();
    const diff = now.getTime() - this.updatedAt.getTime();
    const oneHour = 60 * 60 * 1000;
    return diff < oneHour;
  }

  /**
   * Сессия завершена (есть все ответы)
   */
  isCompleted(): boolean {
    if (!this.quiz?.questions) return false;
    return this.answers.length >= this.quiz.questions.length;
  }

  /**
   * Получить прогресс (в процентах)
   */
  getProgress(): number {
    if (!this.quiz?.questions) return 0;
    const total = this.quiz.questions.length;
    if (total === 0) return 0;
    return Math.round((this.answers.length / total) * 100);
  }

  /**
   * Можно ли продолжить квиз
   */
  canContinue(): boolean {
    return this.isActive() && !this.isCompleted();
  }

  /**
   * Добавить ответ
   */
  addAnswer(questionId: number, answerId: number | null): void {
    // Проверяем, не отвечали ли уже на этот вопрос
    const existingIndex = this.answers.findIndex(
      (a) => a.questionId === questionId,
    );

    if (existingIndex !== -1) {
      // Обновляем существующий ответ
      this.answers[existingIndex].answerId = answerId;
    } else {
      // Добавляем новый ответ
      this.answers.push({ questionId, answerId });
    }

    this.updatedAt = new Date();
  }

  /**
   * Получить возраст сессии
   */
  getAgeInMinutes(): number {
    const now = new Date();
    const diff = now.getTime() - this.updatedAt.getTime();
    return Math.floor(diff / (1000 * 60));
  }
}