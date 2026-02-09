import { Quiz } from "./quiz.interface";

// Добавь интерфейс ответа сверху файла
export interface QuizzesApiResponse {
  success: boolean;
  timestamp: string;
  data: Quiz[];
}