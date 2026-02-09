// src/app/core/services/quiz.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Quiz } from '../interfaces/quiz.interface';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.intergace';


@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getQuizzes(): Observable<Quiz[]> {
    return this.http
      .get<ApiResponse<Quiz[]>>(`${this.apiUrl}/quizzes`)
      .pipe(map(response => response.data));
  }

  getQuizById(id: number): Observable<Quiz> {
    return this.http
      .get<ApiResponse<Quiz>>(`${this.apiUrl}/quizzes/${id}`)
      .pipe(map(response => response.data));
  }

  addQuiz(quiz: Quiz): Observable<Quiz> {
    return this.http
      .post<ApiResponse<Quiz>>(`${this.apiUrl}/quizzes`, quiz)
      .pipe(map(response => response.data));
  }
}