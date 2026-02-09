// services/user-count.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserCountService {
  private filteredCount = new BehaviorSubject<number>(0);
  filteredCount$ = this.filteredCount.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('filteredUserCount');
    const count = stored ? parseInt(stored, 10) : 0;
    this.filteredCount.next(count);
  }

  setFilteredCount(count: number): void {
    localStorage.setItem('filteredUserCount', count.toString());
    this.filteredCount.next(count);
  }

  // Опционально: принудительное обновление
  refresh(): void {
    this.loadFromStorage();
  }
}