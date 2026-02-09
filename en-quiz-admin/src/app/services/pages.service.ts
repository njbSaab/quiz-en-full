// pages.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Page, PageContent } from '../interfaces/pages.interface';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../interfaces/api-response';

@Injectable({
  providedIn: 'root'
})
export class PagesService {
  private apiUrl = environment.apiUrl + '/pages';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Secret-Word': environment.secretWord,
      'Content-Type': 'application/json'
    });
  }

  // ════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЕ МЕТОДЫ (С КЭШЕМ) - для пользователей
  // ════════════════════════════════════════════════════════════

  /**
   * Получить все страницы (С КЭШЕМ)
   * Используется на публичных страницах
   */
  getAllPages(): Observable<Page[]> {
    return this.http.get<ApiResponse<Page[]>>(this.apiUrl).pipe(
      map(response => {
        const pages = response && 'data' in response 
          ? response.data 
          : response as unknown as Page[];
        
        return pages.map(page => this.normalizePage(page));
      })
    );
  }

  /**
   * Получить страницу по slug (С КЭШЕМ)
   * Используется для отображения страниц пользователям
   */
  getPage(slug: string): Observable<Page> {
    return this.http.get<ApiResponse<Page>>(`${this.apiUrl}/${slug}`).pipe(
      map(response => {
        const page = response && 'data' in response 
          ? response.data 
          : response as unknown as Page;
        
        return this.normalizePage(page);
      })
    );
  }

  // ════════════════════════════════════════════════════════════
  // АДМИНСКИЕ МЕТОДЫ (БЕЗ КЭША) - всегда свежие данные
  // ════════════════════════════════════════════════════════════

  /**
   * ✅ НОВОЕ: Получить все страницы для админки (БЕЗ КЭША)
   * 
   * Используется в админ-панели
   * Всегда возвращает актуальные данные
   * Включая неопубликованные страницы
   */
  getAllPagesAdmin(): Observable<Page[]> {
    return this.http.get<ApiResponse<Page[]>>(`${this.apiUrl}/admin/all`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        const pages = response && 'data' in response 
          ? response.data 
          : response as unknown as Page[];
        
        return pages.map(page => this.normalizePage(page));
      })
    );
  }

  /**
   * ✅ НОВОЕ: Получить страницу по ID для админки (БЕЗ КЭША)
   * 
   * Используется при редактировании страницы
   * Всегда возвращает актуальные данные
   * Включая неопубликованные страницы
   */
  getPageByIdAdmin(id: number): Observable<Page> {
    return this.http.get<ApiResponse<Page>>(`${this.apiUrl}/admin/by-id/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        const page = response && 'data' in response 
          ? response.data 
          : response as unknown as Page;
        
        return this.normalizePage(page);
      })
    );
  }

  /**
   * ✅ НОВОЕ: Получить страницу по slug для админки (БЕЗ КЭША)
   * 
   * Используется для просмотра в админке
   * Всегда возвращает актуальные данные
   * Включая неопубликованные страницы
   */
  getPageBySlugAdmin(slug: string): Observable<Page> {
    return this.http.get<ApiResponse<Page>>(`${this.apiUrl}/admin/by-slug/${slug}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        const page = response && 'data' in response 
          ? response.data 
          : response as unknown as Page;
        
        return this.normalizePage(page);
      })
    );
  }

  // ════════════════════════════════════════════════════════════
  // ИЗМЕНЕНИЕ ДАННЫХ
  // ════════════════════════════════════════════════════════════

  /**
   * Обновить страницу
   */
  updatePage(id: number, data: { title?: string; content?: any }): Observable<Page> {
    return this.http.patch<ApiResponse<Page>>(
      `${this.apiUrl}/${id}`, 
      data, 
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        const page = response && 'data' in response 
          ? response.data 
          : response as unknown as Page;
        
        return this.normalizePage(page);
      }),
      // ✅ АВТОМАТИЧЕСКИ очищаем кэш после успешного обновления
      tap(() => {
        console.log('🧹 Auto-clearing pages cache after update');
        this.clearCache().subscribe({
          next: () => console.log('✅ Cache cleared successfully'),
          error: (err) => console.error('❌ Failed to clear cache:', err)
        });
      })
    );
  }

  /**
   * Опубликовать страницу
   */
  publishPage(id: number): Observable<Page> {
    return this.http.patch<ApiResponse<Page>>(
      `${this.apiUrl}/${id}/publish`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        const page = response && 'data' in response 
          ? response.data 
          : response as unknown as Page;
        
        return this.normalizePage(page);
      }),
      tap(() => {
        console.log('🧹 Auto-clearing pages cache after publish');
        this.clearCache().subscribe({
          next: () => console.log('✅ Cache cleared'),
          error: (err) => console.error('❌ Failed to clear cache:', err)
        });
      })
    );
  }

  /**
   * Снять с публикации
   */
  unpublishPage(id: number): Observable<Page> {
    return this.http.patch<ApiResponse<Page>>(
      `${this.apiUrl}/${id}/unpublish`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        const page = response && 'data' in response 
          ? response.data 
          : response as unknown as Page;
        
        return this.normalizePage(page);
      }),
      tap(() => {
        console.log('🧹 Auto-clearing pages cache after unpublish');
        this.clearCache().subscribe({
          next: () => console.log('✅ Cache cleared'),
          error: (err) => console.error('❌ Failed to clear cache:', err)
        });
      })
    );
  }

  // ════════════════════════════════════════════════════════════
  // УТИЛИТЫ
  // ════════════════════════════════════════════════════════════

  /**
   * Очистить кэш страниц
   * 
   * Вызывается автоматически после изменений
   * Также можно вызвать вручную из компонента
   */
  clearCache(): Observable<{ success: boolean; message: string; timestamp: string }> {
    return this.http.delete<{ success: boolean; message: string; timestamp: string }>(
      `${this.apiUrl}/cache`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Получить статистику кэша (для отладки)
   */
  getCacheStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cache/stats`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Универсальный метод нормализации страницы
   */
  private normalizePage(page: Page): Page {
    return {
      ...page,
      content: this.parseContent(page.content)
    };
  }

  /**
   * Парсинг content - поддерживает строку, объект или null
   */
  private parseContent(rawContent: unknown): PageContent {
    if (rawContent == null) return {};
  
    if (typeof rawContent === 'object') {
      return rawContent as PageContent;
    }
  
    if (typeof rawContent === 'string') {
      try {
        return JSON.parse(rawContent);
      } catch (e) {
        console.warn('Failed to parse page content (invalid JSON):', rawContent);
        return {};
      }
    }
  
    console.warn('Unexpected page content type:', typeof rawContent, rawContent);
    return {};
  }

  // ════════════════════════════════════════════════════════════
  // УДОБНЫЕ АЛИАСЫ ДЛЯ КОНКРЕТНЫХ СТРАНИЦ
  // ════════════════════════════════════════════════════════════

  // Публичные методы (С КЭШЕМ) - для пользователей
  getHome()       { return this.getPage('home'); }
  getContacts()   { return this.getPage('contacts'); }
  getAbout()      { return this.getPage('about'); }
  getPrivacy()    { return this.getPage('privacy'); }
  getTerms()      { return this.getPage('terms'); }
  getForm()       { return this.getPage('quiz-result'); }
  getThanksPage() { return this.getPage('quiz-finished'); }

  // ✅ НОВОЕ: Админские методы (БЕЗ КЭША) - для админки
  getHomeAdmin()       { return this.getPageBySlugAdmin('home'); }
  getContactsAdmin()   { return this.getPageBySlugAdmin('contacts'); }
  getAboutAdmin()      { return this.getPageBySlugAdmin('about'); }
  getPrivacyAdmin()    { return this.getPageBySlugAdmin('privacy'); }
  getTermsAdmin()      { return this.getPageBySlugAdmin('terms'); }
  getFormAdmin()       { return this.getPageBySlugAdmin('quiz-result'); }
  getThanksPageAdmin() { return this.getPageBySlugAdmin('quiz-finished'); }
  getMenuItems() { return this.getPageBySlugAdmin('menu-items'); }
}