export class UserResponseDto {
  id: string;
  uuid: string;
  name: string | null;
  email: string | null;
  displayName: string;
  isRegistered: boolean;
  isAnonymous: boolean;
  geo: string | null;
  createdAt: string;
  updatedAt: string;

  browserInfo: any | null;
  completedQuizzesCount: number;
  sessionsCount: number;

  // ✅ Добавляем поля score и totalPoints
  score?: number;
  totalPoints?: number;

  // Если нужны результаты (в деталях)
  results?: Array<{
    id: number;
    quizId: number;
    score: number;
    answers: any[];
    createdAt: string;
    quizTitle?: string;
  }>;
}