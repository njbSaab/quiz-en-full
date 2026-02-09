// src/app/core/services/referral.service.ts

import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReferralService {

  private readonly STORAGE_KEY = 'ref_full_query'; // или ref_raw, ref_source_raw и т.д.

  constructor(private router: Router) {
    this.init();
  }

  private init(): void {
    // Сразу при старте приложения
    this.saveFullQueryIfPresent();

    // И при каждой внутренней навигации
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.saveFullQueryIfPresent());
  }

  /** Сохраняет ВСЮ строку после знака ?, если она есть и не пустая */
  private saveFullQueryIfPresent(): void {
    const fullUrl = this.router.url; // например: "/main?scr=1&user=77" или "/?scr=vip_123"

    const queryIndex = fullUrl.indexOf('?');
    if (queryIndex === -1) {
      // Нет ? → ничего не делаем (старое значение остаётся)
      return;
    }

    const rawQuery = fullUrl.substring(queryIndex + 1); // всё после ?

    if (rawQuery.trim() === '') {
      // ? есть, но пусто:  /page?   → очищаем
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('%cРефералка очищена (пустая query)', 'color: orange');
      return;
    }

    // Сохраняем как есть — со всеми параметрами, порядком, символами
    localStorage.setItem(this.STORAGE_KEY, rawQuery);
    console.log('%cРефералка сохранена →', 'color: #00ff88; font-weight: bold;', rawQuery);
  }

  /** Получить сохранённую полную query-строку */
  getFullQuery(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  /** Для тестов */
  setFullQuery(value: string): void {
    localStorage.setItem(this.STORAGE_KEY, value);
  }

  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}