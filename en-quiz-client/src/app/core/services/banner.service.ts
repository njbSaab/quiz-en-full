// core/services/banner.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const BANNER_CLOSED_KEY = 'bannerClosed_v1';

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private visibleSubject = new BehaviorSubject<boolean>(true);

  // Сразу при старте приложения проверяем, не закрывал ли пользователь баннер раньше
  constructor() {
    const closed = localStorage.getItem(BANNER_CLOSED_KEY) === 'true';
    this.visibleSubject.next(!closed);
  }

  /** Поток видимости баннера */
  visible$: Observable<boolean> = this.visibleSubject.asObservable();

  /** Текущее состояние (для удобства в шаблонах) */
  get isVisible(): boolean {
    return this.visibleSubject.value;
  }

  /** Скрыть баннер (один раз — навсегда, пока не очистят localStorage) */
  hide(): void {
    if (!this.visibleSubject.value) return;

    this.visibleSubject.next(false);
    localStorage.setItem(BANNER_CLOSED_KEY, 'true');
  }

  /** Принудительно показать (например, для тестов или админки) */
  show(): void {
    this.visibleSubject.next(true);
    localStorage.removeItem(BANNER_CLOSED_KEY);
  }
}