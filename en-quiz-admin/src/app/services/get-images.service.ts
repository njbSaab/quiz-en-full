import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Интерфейс обертки ответа от сервера
 */
interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class GetImagesService {
  private imageAddedSubject = new Subject<void>();
  private imageUrl = environment.apiUrl + '/images/';

  constructor(private http: HttpClient) {}

  /**
   * Получить список изображений
   */
  getImages(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(this.imageUrl)
      .pipe(
        map(response => {
          // Проверяем, есть ли обертка
          if (response && 'data' in response) {
            return response.data;
          }
          // Если обертки нет (старый формат), возвращаем как есть
          return response as unknown as string[];
        })
      );
  }

  /**
   * Удалить изображение
   */
  deleteImage(filename: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.imageUrl}${filename}`)
      .pipe(
        map(() => undefined)
      );
  }

  /**
   * Получить изображения по ID
   */
  getImagesById(id: number): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.imageUrl}${id}`)
      .pipe(
        map(response => {
          if (response && 'data' in response) {
            return response.data;
          }
          return response as unknown as string[];
        })
      );
  }

  /**
   * Уведомить об добавлении изображения
   */
  notifyImageAdded(): void {
    this.imageAddedSubject.next();
  }

  /**
   * Подписаться на событие добавления изображения
   */
  onImageAdded(): Observable<void> {
    return this.imageAddedSubject.asObservable();
  }
}