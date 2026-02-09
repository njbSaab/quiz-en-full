// src/app/services/pages.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Page } from '../interfaces/pages.interface';
import { ApiResponse } from '../interfaces/api-response.intergace';


@Injectable({
  providedIn: 'root'
})
export class PagesService {
  private apiUrl = environment.apiUrl + '/pages';
  private cache = new Map<string, Page>();

  constructor(private http: HttpClient) {}

  /** Получить страницу по slug */
  getPage(slug: string): Observable<Page> {
    // 1. Кэш на клиенте
    if (this.cache.has(slug)) {
      return of(this.cache.get(slug)!);
    }

    // 2. Запрос к API
    return this.http.get<ApiResponse<Page>>(`${this.apiUrl}/${slug}`).pipe(
      map(response => response.data), // 🎯 Извлекаем data из обертки
      map(page => this.parseContent(page)),
      tap(page => this.cache.set(slug, page)),
      catchError(err => {
        console.error(`Page "${slug}" not found or error:`, err);
        const emptyPage: Page = {
          id: 0,
          slug,
          title: '',
          content: {},
          isActive: false,
          createdAt: '',
          updatedAt: ''
        };
        this.cache.set(slug, emptyPage);
        return of(emptyPage);
      })
    );
  }

  /** Удобные алиасы */
  getHome() { return this.getPage('home'); }
  getContacts() { return this.getPage('contacts'); }
  getAbout() { return this.getPage('about'); }
  getPrivacy() { return this.getPage('privacy'); }
  getTerms() { return this.getPage('terms'); }
  getFaq() { return this.getPage('faq'); }

  /** Очистить кэш */
  clearCache() {
    this.cache.clear();
  }

  /** Парсим content, если он пришёл строкой */
  private parseContent(page: Page): Page {
    if (page.content && typeof page.content === 'string') {
      try {
        page.content = JSON.parse(page.content);
      } catch (e) {
        console.warn(`Invalid JSON in page ${page.slug}`);
        page.content = {};
      }
    }
    return page;
  }
}