// src/app/core/services/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserSessionData } from '../interfaces/user.interface';
import { UserIdentityService } from './user-identity.service';

/**
 * User Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО HTTP взаимодействие с API
 * - НЕ управляет идентификацией (делегирует в UserIdentityService)
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private identityService: UserIdentityService,
  ) {}

  /**
   * Получить заголовки для запросов
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Secret-Word': 'TOPWINNER_TOP_QUIZWIZ_WORLD',
    });
  }

  // ────────────────────────────────────────────────────────────
  // ГЕТТЕРЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
  // ────────────────────────────────────────────────────────────

  /**
   * Получить sessionId (синхронно)
   */
  getSessionId(): string {
    return this.identityService.getSessionId();
  }

  /**
   * Получить userId (асинхронно)
   */
  async getUserId(): Promise<string> {
    return this.identityService.getUserId();
  }

  // ────────────────────────────────────────────────────────────
  // СЕССИИ
  // ────────────────────────────────────────────────────────────

  /**
   * Сохранить сессию пользователя
   * Вызывается ТОЛЬКО ОДИН РАЗ при начале квиза
   */
  async saveUserSession(sessionData: Partial<UserSessionData>): Promise<void> {
    const identity = await this.identityService.getUserIdentity();

    const fullSessionData: UserSessionData = {
      quizId: sessionData.quizId!,
      userId: identity.userId, // 🎯 visitorId
      sessionId: identity.sessionId,
      currentQuestionIndex: sessionData.currentQuestionIndex || 0,
      correctAnswersCount: sessionData.correctAnswersCount || 0,
      totalPoints: sessionData.totalPoints || 0,
      answers: sessionData.answers || [],
      browserInfo: sessionData.browserInfo!,
    };

    console.log('📤 Отправка сессии:', fullSessionData);

    this.http
      .post(`${this.apiUrl}/users/session`, fullSessionData, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          console.log('✅ Сессия сохранена:', response);
          return response;
        }),
        catchError((error) => {
          // Игнорируем ошибку дубликата
          if (error.status === 409) {
            console.log('⚠️ Сессия уже существует (игнорируем)');
            return of(null);
          }

          console.error('❌ Ошибка сохранения сессии:', error);
          return of(null);
        })
      )
      .subscribe();
  }

  // ────────────────────────────────────────────────────────────
  // ПОЛЬЗОВАТЕЛИ
  // ────────────────────────────────────────────────────────────

  /**
   * Добавить пользователя
   * ИСПРАВЛЕНО: возвращает Observable напрямую
   */
  async addUser(user: {
    name: string;
    email: string;
    geo: string;
  }): Promise<Observable<any>> {
    const identity = await this.identityService.getUserIdentity();

    const userData = {
      uuid: identity.userId, // 🎯 visitorId как uuid
      name: user.name,
      email: user.email,
      sessionId: identity.sessionId,
      geo: user.geo,
    };

    return this.http
      .post(`${this.apiUrl}/users`, userData, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          console.log('✅ Пользователь добавлен:', response);
          return response;
        }),
        catchError((error) => {
          console.error('❌ Ошибка добавления пользователя:', error);
          return of(null);
        })
      );
  }

  // ────────────────────────────────────────────────────────────
  // РЕЗУЛЬТАТЫ КВИЗОВ
  // ────────────────────────────────────────────────────────────

  /**
   * Отправить результат квиза
   */
  async addUserResult(result: {
    quizId: number;
    score: number;
    answers: any[];
    geo?: string;
  }): Promise<void> {
    const identity = await this.identityService.getUserIdentity();

    const resultData = {
      quizId: result.quizId,
      userId: identity.userId, // 🎯 visitorId
      sessionId: identity.sessionId,
      score: result.score,
      answers: result.answers,
      geo: result.geo || null,
      ref_source: identity.refQuery || null, // 🎯 Реферальная ссылка
    };

    console.log('📤 Отправка результата:', resultData);

    this.http
      .post(`${this.apiUrl}/quiz-results/submit`, resultData, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          console.log('✅ Результат сохранен:', response);
          return response;
        }),
        catchError((error) => {
          console.error('❌ Ошибка сохранения результата:', error);
          return of(null);
        })
      )
      .subscribe();
  }

  // ────────────────────────────────────────────────────────────
  // БРАУЗЕРНАЯ ИНФОРМАЦИЯ
  // ────────────────────────────────────────────────────────────

  /**
   * Получить информацию о браузере
   */
  async getBrowserInfo(): Promise<any> {
    const browserInfo: any = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: { width: window.screen.width, height: window.screen.height },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      platform: navigator.platform,
      referrer: document.referrer,
      ipAddress: await this.getIpAddress(),
      geolocation: undefined,
    };

    // Геолокация (опционально)
    if (navigator.geolocation) {
      try {
        browserInfo.geolocation = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) =>
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            () => resolve(undefined),
            { timeout: 5000 }
          );
        });
      } catch (error) {
        console.warn('⚠️ Геолокация недоступна:', error);
      }
    }

    return browserInfo;
  }

  /**
   * Получить IP адрес
   */
  private async getIpAddress(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }
}