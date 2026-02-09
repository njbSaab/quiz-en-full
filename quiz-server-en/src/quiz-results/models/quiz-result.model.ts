// src/modules/quiz-results/models/quiz-result.model.ts

/**
 * Доменная модель Quiz Result
 * 
 * Information Expert (GRASP):
 * - Знает о структуре результата квиза
 * - Содержит бизнес-правила для результатов
 * - НЕ знает о БД
 */
export class QuizResultModel {
  id: number;
  userId: string;
  quizId: number;
  sessionId: string | null;
  score: number;
  answers: EnrichedAnswer[];
  geo: string | null;
  refSource: string | null; // 🎯 Добавили
  createdAt: Date;

  // Связи
  user?: any;
  quiz?: any;

  constructor(data: Partial<QuizResultModel>) {
    Object.assign(this, data);
  }

  // ────────────────────────────────────────────────────────────
  // Фабричные методы
  // ────────────────────────────────────────────────────────────

  /**
   * Создать новый результат
   */
  static create(data: {
    quizId: number;
    userId: string;
    sessionId: string;
    score: number;
    answers: any[];
    geo?: string | null;
    refSource?: string | null;
  }): QuizResultModel {
    return new QuizResultModel({
      ...data,
      id: 0, // Будет установлен БД
      createdAt: new Date(),
    });
  }

  /**
   * Создать из Prisma объекта
   */
  static fromPrisma(prismaResult: any): QuizResultModel {
    return new QuizResultModel({
      id: prismaResult.id,
      userId: prismaResult.userId,
      quizId: prismaResult.quizId,
      sessionId: prismaResult.sessionId,
      score: prismaResult.score,
      answers: prismaResult.answers as EnrichedAnswer[],
      geo: prismaResult.geo,
      refSource: prismaResult.refSource,
      createdAt: prismaResult.createdAt,
      user: prismaResult.user,
      quiz: prismaResult.quiz,
    });
  }

  // ────────────────────────────────────────────────────────────
  // Валидация
  // ────────────────────────────────────────────────────────────

  /**
   * Валидировать ответы
   */
  validateAnswers(questions: any[]): void {
    if (!this.answers || this.answers.length === 0) {
      throw new Error('Answers cannot be empty');
    }

    const questionIds = questions.map(q => q.id);
    const invalidAnswers = this.answers.filter(
      a => !questionIds.includes(a.questionId)
    );

    if (invalidAnswers.length > 0) {
      throw new Error(
        `Invalid question IDs: ${invalidAnswers.map(a => a.questionId).join(', ')}`
      );
    }
  }

  // ────────────────────────────────────────────────────────────
  // Бизнес-методы
  // ────────────────────────────────────────────────────────────

  /**
   * Получить количество правильных ответов
   */
  getCorrectAnswersCount(): number {
    return this.answers.filter((a) => a.isCorrect).length;
  }

  /**
   * Получить количество неправильных ответов
   */
  getIncorrectAnswersCount(): number {
    return this.answers.filter((a) => !a.isCorrect).length;
  }

  /**
   * Получить общее количество вопросов
   */
  getTotalQuestions(): number {
    return this.answers.length;
  }

  /**
   * Получить процент правильных ответов
   */
  getAccuracyPercentage(): number {
    const total = this.getTotalQuestions();
    if (total === 0) return 0;
    return Math.round((this.getCorrectAnswersCount() / total) * 100);
  }

  /**
   * Проверить, прошел ли пользователь квиз (более 50%)
   */
  isPassed(): boolean {
    return this.getAccuracyPercentage() >= 50;
  }

  /**
   * Получить рейтинг (A, B, C, D, F)
   */
  getGrade(): string {
    const percentage = this.getAccuracyPercentage();
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Получить статус выполнения
   */
  getStatus(): 'excellent' | 'good' | 'average' | 'poor' {
    const percentage = this.getAccuracyPercentage();
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'poor';
  }

  /**
   * Получить сообщение по результату
   */
  getResultMessage(quizResultMessages?: Record<string, string>): string {
    if (!quizResultMessages) {
      return this.getDefaultMessage();
    }

    // Ищем сообщение по баллам
    for (const [range, message] of Object.entries(quizResultMessages)) {
      const [min, max] = range.split('-').map(Number);
      if (this.score >= min && this.score <= max) {
        return message;
      }
    }

    return this.getDefaultMessage();
  }

  /**
   * Получить дефолтное сообщение
   */
  private getDefaultMessage(): string {
    const status = this.getStatus();
    const messages = {
      excellent: `Отлично! Вы набрали ${this.score} баллов!`,
      good: `Хорошо! Вы набрали ${this.score} баллов!`,
      average: `Неплохо! Вы набрали ${this.score} баллов!`,
      poor: `Попробуйте еще раз! Вы набрали ${this.score} баллов.`,
    };
    return messages[status];
  }

  /**
   * Проверить, можно ли отправить email
   */
  canSendEmail(): boolean {
    return this.user?.email && this.getAccuracyPercentage() >= 50;
  }
}

/**
 * Интерфейс обогащенного ответа
 */
export interface EnrichedAnswer {
  questionId: number;
  answerId: number;
  questionText?: string;
  answerText?: string;
  isCorrect: boolean;
  points?: number;
  geo?: string | null;
}