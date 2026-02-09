// src/modules/edit-content/models/edit-content.model.ts

/**
 * Доменная модель EditContent
 * 
 * Information Expert (GRASP):
 * - Знает о структуре редактируемого контента
 * - Содержит бизнес-правила
 * - НЕ знает о БД
 */
export class EditContentModel {
  id: number;
  slug: string;
  title: string;
  content: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<EditContentModel>) {
    Object.assign(this, data);
  }

  // ────────────────────────────────────────────────────────────
  // Бизнес-методы
  // ────────────────────────────────────────────────────────────

  /**
   * Доступен ли контент для просмотра
   */
  isAvailable(): boolean {
    return this.isActive;
  }

  /**
   * Есть ли контент
   */
  hasContent(): boolean {
    return Object.keys(this.content).length > 0;
  }

  /**
   * Валидация: можно ли опубликовать
   */
  canBePublished(): boolean {
    return this.hasValidTitle() && this.hasContent();
  }

  /**
   * Получить краткое содержание
   */
  getExcerpt(length: number = 100): string {
    const text = JSON.stringify(this.content);
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  /**
   * Опубликовать контент
   */
  publish(): void {
    if (!this.canBePublished()) {
      throw new Error('Cannot publish: title or content is invalid');
    }
    this.isActive = true;
  }

  /**
   * Снять с публикации
   */
  unpublish(): void {
    this.isActive = false;
  }

  /**
   * Обновить контент
   */
  updateContent(newContent: Record<string, any>): void {
    this.content = newContent;
    this.updatedAt = new Date();
  }

  /**
   * Обновить заголовок
   */
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length < 3) {
      throw new Error('Title must be at least 3 characters');
    }
    this.title = newTitle;
    this.updatedAt = new Date();
  }

  // ────────────────────────────────────────────────────────────
  // Приватные методы валидации
  // ────────────────────────────────────────────────────────────

  private hasValidTitle(): boolean {
    return Boolean(this.title && this.title.trim().length >= 3);
  }
}