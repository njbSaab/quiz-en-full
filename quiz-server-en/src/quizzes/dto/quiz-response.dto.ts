// src/modules/quizzes/dto/quiz-response.dto.ts

/**
 * DTO для ответа с квизом
 * Single Responsibility: только структура ответа
 */
export class QuizResponseDto {
  id: number;
  title: string;
  titleAdm: string;               
  description: string;
  firstPage: string;
  finalPage: string;
  descriptionAdm: string;         
  descrip: string;               
  quizShortTitle: string;
  isActive: boolean;
  previewImage: string | null;
  rating: number | null;
  type: string;
  resultMessages: Record<string, string> | null;
  quizInfo: Record<string, any> | null;
  questionCount: number;
  isMainView: boolean;
  questions?: {
    id: number;
    text: string;
    image: string | null;
    order: number;
    answers?: {
      id: number;
      text: string;
      isCorrect: boolean;
      points: number;
    }[];
  }[];
  category?: any;
  createdAt: string;
  updatedAt: string;
}