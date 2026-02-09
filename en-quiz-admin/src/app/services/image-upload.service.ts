import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../interfaces/api-response';


/**
 * Интерфейс ответа при загрузке изображения
 */
interface UploadResponse {
  success: boolean;
  path: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  private uploadUrl = environment.apiUrl + '/upload';

  constructor(private http: HttpClient) {}

  /**
   * Загрузить изображение
   * @param file - файл изображения
   * @returns Observable с путем к загруженному изображению
   */
  uploadImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<ApiResponse<UploadResponse>>(this.uploadUrl, formData)
      .pipe(
        map(response => {
          // Проверяем, есть ли обертка
          if (response && 'data' in response) {
            return response.data;
          }
          // Если обертки нет (старый формат), возвращаем как есть
          return response as unknown as UploadResponse;
        })
      );
  }
}