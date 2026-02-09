export interface Quiz {
  // === ОСНОВНЫЕ ПОЛЯ ===
  id: number;
  title: string;
  titleAdm: string;                    // Обязательное в БД
  quizShortTitle: string;              // Обязательное в БД
  // === ОПИСАНИЯ ===
  description?: string;
  descriptionAdm?: string;
  descrip?: string;                    // Краткое описание

  // === СТРАНИЦЫ ===
  firstPage?: string;
  finalPage?: string;

  // === ВНЕШНИЙ ВИД ===
  previewImage?: string;
  isMainView?: boolean;                // Отображать на главной

  // === СТАТУС ===
  isActive: boolean;

  // === МЕТАДАННЫЕ ===
  createdAt: string;
  updatedAt: string;

  // === СТАТИСТИКА ===
  rating?: number;
  categoryId?: number | null;

  // === ДОПОЛНИТЕЛЬНО ===
  quizInfo?: QuizInfo;                
  resultMessages?: Record<string, string>; 
  type: 'POINTS' | 'MAJORITY';
  // === ВЛОЖЕННЫЕ ВОПРОСЫ ===
  questions: QuizQuestion[];
}
export interface QuizInfo {
  firstText?: string;
  secondText?: string;
  partnerBonus?: string;
  partnerBonus2?: string;
  partnerBonus3?: string;
  btnLink?: string;
}
// Вопрос
export interface QuizQuestion {
  id?: number;                        // Опционально при создании
  text: string;
  image?: string | null;
  order?: number;
  answers: QuizAnswer[];
}

// Ответ
export interface QuizAnswer {
  id?: number;                        // Опционально при создании
  text: string;
  isCorrect: boolean;
  points: number;
}