// src/app/services/quiz.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Quiz } from '../interfaces/quiz.interface';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private apiUrl = environment.apiUrl;
  private secretWord = 'TOPWINNER_TOP_QUIZWIZ_WORLD';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Secret-Word': this.secretWord,
      'Content-Type': 'application/json',
    });
  }

  // ════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЕ МЕТОДЫ (С КЭШЕМ) - для пользователей
  // ════════════════════════════════════════════════════════════

  /**
   * Получить все квизы (С КЭШЕМ)
   * Используется на публичных страницах
   */
  getQuizzes(): Observable<Quiz[]> {
    return this.http.get<ApiResponse<Quiz[]>>(`${this.apiUrl}/quizzes`)
      .pipe(
        map(response => {
          if (response && 'data' in response) {
            return response.data;
          }
          return response as unknown as Quiz[];
        })
      );
  }

  /**
   * Получить квиз по ID (С КЭШЕМ, с перемешанными ответами)
   * Используется при прохождении квиза
   */
  getQuizById(id: number): Observable<Quiz> {
    return this.http.get<ApiResponse<Quiz>>(`${this.apiUrl}/quizzes/${id}`)
      .pipe(
        map(response => {
          if (response && 'data' in response) {
            return response.data;
          }
          return response as unknown as Quiz;
        })
      );
  }

  // ════════════════════════════════════════════════════════════
  // АДМИНСКИЕ МЕТОДЫ (БЕЗ КЭША) - всегда свежие данные
  // ════════════════════════════════════════════════════════════

  /**
   * ✅ Получить все квизы для админки (БЕЗ КЭША)
   * 
   * Используется в админ-панели
   * Всегда возвращает актуальные данные
   * Требует secret-word
   */
  getQuizzesAdmin(): Observable<Quiz[]> {
    return this.http.get<ApiResponse<Quiz[]>>(`${this.apiUrl}/quizzes/admin/all`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response as unknown as Quiz[];
      })
    );
  }

  /**
   * ✅ Получить квиз по ID для админки (БЕЗ КЭША)
   * 
   * Используется при редактировании квиза
   * Всегда возвращает актуальные данные
   * НЕ перемешивает ответы (нужен оригинальный порядок)
   * Требует secret-word
   */
  getQuizByIdAdmin(id: number): Observable<Quiz> {
    return this.http.get<ApiResponse<Quiz>>(`${this.apiUrl}/quizzes/admin/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response as unknown as Quiz;
      })
    );
  }

  // ════════════════════════════════════════════════════════════
  // ИЗМЕНЕНИЕ ДАННЫХ
  // ════════════════════════════════════════════════════════════

  /**
   * Добавить новый квиз
   */
  addQuiz(quiz: Partial<Quiz>): Observable<Quiz> {
    return this.http.post<ApiResponse<Quiz>>(`${this.apiUrl}/quizzes`, quiz, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response as unknown as Quiz;
      }),
      // ✅ АВТОМАТИЧЕСКИ очищаем кэш после создания
      tap(() => {
        console.log('🧹 Auto-clearing quizzes cache after create');
        this.clearCache().subscribe({
          next: () => console.log('✅ Cache cleared'),
          error: (err) => console.error('❌ Failed to clear cache:', err)
        });
      })
    );
  }

  /**
   * Обновить квиз
   */
  updateQuiz(id: number, quiz: Partial<Quiz>): Observable<Quiz> {
    const cleanedQuiz = {
      ...quiz,
      questions: quiz.questions?.map((q) => {
        const { id, ...questionRest } = q;
        return {
          ...questionRest,
          id: id && id !== 0 ? id : undefined,
          answers: q.answers?.map((a) => {
            const { id, ...answerRest } = a;
            return id && id !== 0 ? { id, ...answerRest } : answerRest;
          }) || [],
        };
      }) || [],
    };

    return this.http.patch<ApiResponse<Quiz>>(`${this.apiUrl}/quizzes/${id}`, cleanedQuiz, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response as unknown as Quiz;
      }),
      // ✅ АВТОМАТИЧЕСКИ очищаем кэш после обновления
      tap(() => {
        console.log('🧹 Auto-clearing quizzes cache after update');
        this.clearCache().subscribe({
          next: () => console.log('✅ Cache cleared'),
          error: (err) => console.error('❌ Failed to clear cache:', err)
        });
      })
    );
  }

  /**
   * Удалить квиз
   */
  deleteQuiz(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/quizzes/${id}`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(() => undefined),
      // ✅ АВТОМАТИЧЕСКИ очищаем кэш после удаления
      tap(() => {
        console.log('🧹 Auto-clearing quizzes cache after delete');
        this.clearCache().subscribe({
          next: () => console.log('✅ Cache cleared'),
          error: (err) => console.error('❌ Failed to clear cache:', err)
        });
      })
    );
  }

  /**
   * Переключить статус активности квиза
   */
  toggleQuizActive(id: number): Observable<Quiz> {
    return this.http.patch<ApiResponse<Quiz>>(
      `${this.apiUrl}/quizzes/${id}/toggle-active`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response as unknown as Quiz;
      }),
      // ✅ АВТОМАТИЧЕСКИ очищаем кэш после изменения статуса
      tap(() => {
        console.log('🧹 Auto-clearing quizzes cache after toggle');
        this.clearCache().subscribe({
          next: () => console.log('✅ Cache cleared'),
          error: (err) => console.error('❌ Failed to clear cache:', err)
        });
      })
    );
  }

  // ════════════════════════════════════════════════════════════
  // ДРУГИЕ МЕТОДЫ
  // ════════════════════════════════════════════════════════════

  /**
   * Отправить результаты квиза
   */
  submitQuiz(
    id: number,
    submission: { 
      user: { name: string; email: string }; 
      answers: { questionId: number; answerId: number }[] 
    }
  ): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/quizzes/submit/${id}`, submission, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Получить статистику квиза
   */
  getQuizStatistics(id: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/quizzes/statistics/${id}`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Очистить кэш квизов
   * 
   * Вызывается автоматически после изменений
   * Также можно вызвать вручную из компонента
   */
  clearCache(): Observable<{ success: boolean; message: string; timestamp: string }> {
    return this.http.delete<{ success: boolean; message: string; timestamp: string }>(
      `${this.apiUrl}/quizzes/cache`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Получить статистику кэша (для отладки)
   */
  getCacheStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/quizzes/cache/stats`, {
      headers: this.getAuthHeaders()
    });
  }
}