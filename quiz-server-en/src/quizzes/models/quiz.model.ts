// src/modules/quizzes/models/quiz.model.ts

/**
 * Доменная модель Quiz
 * 
 * Information Expert (GRASP):
 * - Знает о структуре квиза
 * - Содержит бизнес-правила
 * - НЕ знает о БД
 */
export class QuizModel {
  id: number;
  title: string;
  titleAdm: string;
  description: string;
  descriptionAdm: string;
  descrip: string;
  quizShortTitle: string;
  firstPage: string;
  finalPage: string;
  isActive: boolean;
  isMainView: boolean;
  previewImage: string | null;
  categoryId: number | null;
  rating: number | null;
  type: string; // 'POINTS' | 'PERSONALITY' | 'TRUE_FALSE'
  resultMessages: Record<string, string> | null;
  quizInfo: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;

  // Связи
  questions?: QuestionModel[];
  category?: any;

  constructor(data: Partial<QuizModel>) {
    Object.assign(this, data);
  }

  // ────────────────────────────────────────────────────────────
  // Бизнес-методы
  // ────────────────────────────────────────────────────────────

  /**
   * Можно ли играть в квиз?
   */
  isPlayable(): boolean {
    return this.isActive && this.hasQuestions();
  }

  /**
   * Есть ли вопросы?
   */
  hasQuestions(): boolean {
    return this.questions && this.questions.length > 0;
  }

  /**
   * Получить количество вопросов
   */
  getQuestionCount(): number {
    return this.questions?.length || 0;
  }

  /**
   * Активировать квиз
   */
  activate(): void {
    if (!this.hasQuestions()) {
      throw new Error('Cannot activate quiz without questions');
    }
    this.isActive = true;
  }

  /**
   * Деактивировать квиз
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Переключить статус активности
   */
  toggleActive(): void {
    if (!this.isActive && !this.hasQuestions()) {
      throw new Error('Cannot activate quiz without questions');
    }
    this.isActive = !this.isActive;
  }

  /**
   * Получить сообщение по количеству баллов
   */
  getResultMessage(score: number): string | null {
    if (!this.resultMessages) return null;

    for (const [range, message] of Object.entries(this.resultMessages)) {
      const [min, max] = range.split('-').map(Number);
      if (score >= min && score <= max) {
        return message;
      }
    }

    return null;
  }

  /**
   * Можно ли показывать на главной?
   */
  canShowOnMain(): boolean {
    return this.isMainView && this.isActive && this.hasQuestions();
  }
}

/**
 * Доменная модель Question
 */
export class QuestionModel {
  id: number;
  text: string;
  image: string | null;
  order: number;
  quizId: number;
  answers?: AnswerModel[];

  constructor(data: Partial<QuestionModel>) {
    Object.assign(this, data);
  }

  /**
   * Перемешать ответы (для показа пользователю)
   */
  shuffleAnswers(): AnswerModel[] {
    if (!this.answers) return [];
    const shuffled = [...this.answers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Получить правильный ответ
   */
  getCorrectAnswer(): AnswerModel | null {
    return this.answers?.find(a => a.isCorrect) || null;
  }
}

/**
 * Доменная модель Answer
 */
export class AnswerModel {
  id: number;
  text: string;
  isCorrect: boolean;
  points: number;
  questionId: number;

  constructor(data: Partial<AnswerModel>) {
    Object.assign(this, data);
  }
}