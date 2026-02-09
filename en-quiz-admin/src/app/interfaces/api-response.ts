/**
 * Интерфейс обертки ответа от сервера
 */
export interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
}