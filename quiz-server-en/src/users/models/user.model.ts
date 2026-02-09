// src/modules/users/models/user.model.ts

/**
 * Доменная модель User
 * 
 * Information Expert (GRASP):
 * - Знает о структуре пользователя
 * - Содержит бизнес-правила
 * - НЕ знает о БД
 */
export class UserModel {
  id: number;
  uuid: string;
  name: string | null;
  email: string | null;
  geo: string | null;
  createdAt: Date;
  updatedAt: Date;
  browserInfo: any | null = null;
  // Связи
  sessions?: any[];
  results?: any[];
  // Дополнительные поля, которые будут вычисляться
  completedQuizzesCount?: number;
  sessionsCount?: number;
  score?: number;
  totalPoints?: number;

  constructor(data: Partial<UserModel>) {
    Object.assign(this, data);
    this.browserInfo = data.browserInfo ?? null;
  }

  // ────────────────────────────────────────────────────────────
  // Бизнес-методы
  // ────────────────────────────────────────────────────────────

  /**
   * Зарегистрирован ли пользователь (есть email)
   */
  isRegistered(): boolean {
    return Boolean(this.email);
  }

  /**
   * Анонимный пользователь (нет email)
   */
  isAnonymous(): boolean {
    return !this.email;
  }

  /**
   * Есть ли имя
   */
  hasName(): boolean {
    return Boolean(this.name && this.name.trim().length > 0);
  }

  /**
   * Получить отображаемое имя
   */
  getDisplayName(): string {
    if (this.name) return this.name;
    if (this.email) return this.email;
    return 'Anonymous';
  }

  /**
   * Можно ли отправить email
   */
  canReceiveEmail(): boolean {
    return Boolean(this.email);
  }

  /**
   * Обновить профиль
   */
  updateProfile(name?: string, email?: string): void {
    if (name !== undefined) {
      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }
      this.name = name;
    }

    if (email !== undefined) {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }
      this.email = email;
    }

    this.updatedAt = new Date();
  }

  /**
   * Валидация email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Получить количество завершенных квизов
   */
  getCompletedQuizzesCount(): number {
    return this.results?.length || 0;
  }

  /**
   * Получить количество сессий
   */
  getSessionsCount(): number {
    return this.sessions?.length || 0;
  }
}