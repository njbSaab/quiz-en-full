// src/app/core/services/user-identity.service.ts

import { Injectable } from '@angular/core';
import { FingerprintService } from './fingerprint.service';
import { SessionService } from './session.service';
import { ReferralService } from './referral.service';

/**
 * User Identity Service
 * 
 * Controller (GRASP):
 * - Координирует Fingerprint, Session, Referral
 * - Предоставляет единый интерфейс для идентификации
 */
@Injectable({
  providedIn: 'root',
})
export class UserIdentityService {
  private identityInitialized = false;

  constructor(
    private fingerprintService: FingerprintService,
    private sessionService: SessionService,
    private referralService: ReferralService,
  ) {}

  /**
   * Инициализировать идентификацию пользователя
   * Вызывается ОДИН РАЗ при старте приложения
   */
  async initialize(): Promise<void> {
    if (this.identityInitialized) {
      console.log('⚠️ Identity уже инициализирована');
      return;
    }

    console.log('🚀 Инициализация идентификации пользователя...');

    // 1. Получаем visitorId (userId)
    const visitorId = await this.fingerprintService.getVisitorId();

    // 2. Получаем или создаем sessionId
    const sessionId = this.sessionService.getSessionId();

    // 3. Получаем реферальную ссылку (уже работает в ReferralService)
    const refQuery = this.referralService.getFullQuery();

    console.log('✅ Идентификация завершена:', {
      visitorId,
      sessionId,
      refQuery,
    });

    this.identityInitialized = true;
  }

  /**
   * Получить userId (visitorId)
   */
  async getUserId(): Promise<string> {
    return this.fingerprintService.getVisitorId();
  }

  /**
   * Получить sessionId
   */
  getSessionId(): string {
    return this.sessionService.getSessionId();
  }

  /**
   * Получить реферальную ссылку
   */
  getReferralQuery(): string | null {
    return this.referralService.getFullQuery();
  }

  /**
   * Получить полную информацию о пользователе
   */
  async getUserIdentity(): Promise<{
    userId: string;
    sessionId: string;
    refQuery: string | null;
  }> {
    const userId = await this.getUserId();
    const sessionId = this.getSessionId();
    const refQuery = this.getReferralQuery();

    return { userId, sessionId, refQuery };
  }

  /**
   * Создать новую сессию (для нового квиза)
   */
  createNewSession(): string {
    return this.sessionService.createNewSession();
  }

  /**
   * Очистить все данные (для тестирования)
   */
  clearAll(): void {
    this.fingerprintService.clearCache();
    this.sessionService.clearSession();
    this.referralService.clear();
    this.identityInitialized = false;
    console.log('🗑️ Вся идентификация очищена');
  }
}