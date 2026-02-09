// src/users/interfaces/answer.interface.ts
export interface QuizAnswer {
    questionId: number;
    answerId: number | null;
    questionText?: string;
    answerText?: string;
    isCorrect?: boolean;
    points?: number;
  }