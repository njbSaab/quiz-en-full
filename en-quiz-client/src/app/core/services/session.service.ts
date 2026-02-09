// src/app/core/services/session.service.ts

import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * Session Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО управление sessionId
 * - НЕ знает о пользователях, API, fingerprint
 */
@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly SESSION_KEY = 'sessionId';
  private cachedSessionId: string | null = null;

  /**
   * Получить текущий sessionId
   * Создает новый, если не существует
   */
  getSessionId(): string {
    // 1. Проверяем кэш в памяти
    if (this.cachedSessionId) {
      return this.cachedSessionId;
    }

    // 2. Проверяем localStorage
    let sessionId = localStorage.getItem(this.SESSION_KEY);

    // 3. Создаем новый, если нет
    if (!sessionId) {
      sessionId = this.createNewSession();
    }

    this.cachedSessionId = sessionId;
    return sessionId;
  }

  /**
   * Создать новую сессию
   */
  createNewSession(): string {
    const sessionId = uuidv4();
    localStorage.setItem(this.SESSION_KEY, sessionId);
    this.cachedSessionId = sessionId;
    console.log('✅ Новая сессия создана:', sessionId);
    return sessionId;
  }

  /**
   * Проверить, новая ли сессия
   */
  isNewSession(): boolean {
    return !localStorage.getItem(this.SESSION_KEY);
  }

  /**
   * Очистить сессию
   */
  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.cachedSessionId = null;
    console.log('🗑️ Сессия очищена');
  }
}