// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, UserResult } from '../interfaces/users.interface';
import { ApiResponse } from '../interfaces/api-response';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private secretWord = environment.secretWord;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Secret-Word': this.secretWord,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Получить всех пользователей (БЕЗ results, С browserInfo из сессии)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/users`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => {
        // Разворачиваем обертку
        const users = response && 'data' in response 
          ? response.data 
          : response as unknown as User[];
        
        console.log('Raw users from API:', users);
        
        // ✅ НЕ нормализуем - данные уже правильные с бэкенда
        // browserInfo уже есть из сессии
        // results пустые (загрузятся отдельно)
        return users;
      }),
      tap(users => {
        console.log('Processed users:', {
          total: users.length,
          withBrowserInfo: users.filter(u => u.browserInfo).length,
          sample: users[0]
        });
      })
    );
  }

  /**
   * Получить пользователя по UUID (С results и browserInfo)
   */
  getUserById(uuid: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/${uuid}`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => {
        const user = response && 'data' in response 
          ? response.data 
          : response as unknown as User;
        
        console.log('Full user data loaded:', user);
        
        // ✅ НЕ нормализуем - данные уже правильные
        // results уже enriched с бэкенда
        // browserInfo уже есть из сессии
        return user;
      })
    );
  }

  /**
   * Удалить пользователя
   */
  deleteUser(uuid: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/users/${uuid}`, {
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
}