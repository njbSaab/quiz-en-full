// src/app/core/services/fingerprint.service.ts

import { Injectable } from '@angular/core';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Fingerprint Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО генерация visitorId через FingerprintJS
 */
@Injectable({
  providedIn: 'root',
})
export class FingerprintService {
  private fpPromise: Promise<any> | null = null;
  private cachedVisitorId: string | null = null;

  constructor() {
    // Инициализируем FingerprintJS при создании сервиса
    this.fpPromise = FingerprintJS.load();
  }

  /**
   * Получить уникальный visitorId
   * Кэшируется в памяти и localStorage
   */
  async getVisitorId(): Promise<string> {
    // 1. Проверяем кэш в памяти
    if (this.cachedVisitorId) {
      return this.cachedVisitorId;
    }

    // 2. Проверяем localStorage
    const stored = localStorage.getItem('visitorId');
    if (stored) {
      this.cachedVisitorId = stored;
      return stored;
    }

    // 3. Генерируем новый visitorId
    try {
      const fp = await this.fpPromise!;
      const result = await fp.get();
      const visitorId = result.visitorId;

      // Сохраняем в кэш и localStorage
      this.cachedVisitorId = visitorId;
      localStorage.setItem('visitorId', visitorId);

      console.log('✅ visitorId получен:', visitorId);
      return visitorId;
    } catch (error) {
      console.error('❌ Ошибка получения visitorId:', error);
      // Fallback: генерируем случайный ID
      const fallbackId = this.generateFallbackId();
      localStorage.setItem('visitorId', fallbackId);
      return fallbackId;
    }
  }

  /**
   * Fallback ID на случай ошибки FingerprintJS
   */
  private generateFallbackId(): string {
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Очистить кэш (для тестирования)
   */
  clearCache(): void {
    this.cachedVisitorId = null;
    localStorage.removeItem('visitorId');
  }
}