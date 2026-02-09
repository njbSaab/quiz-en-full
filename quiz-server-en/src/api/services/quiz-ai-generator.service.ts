import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { CreateQuizDto } from 'src/quizzes/dto/create-quiz.dto';

@Injectable()
export class QuizAIGeneratorService {
  private readonly logger = new Logger(QuizAIGeneratorService.name);
  private readonly client: Groq;

  constructor() {
    const apiKey = process.env.GROQ_SECRET_KEY;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 30) {
      this.logger.error(
        '❌ GROQ_SECRET_KEY отсутствует или некорректен! Добавьте его в .env и перезапустите сервер.',
      );
      throw new Error('Missing or invalid GROQ_SECRET_KEY');
    }

    this.logger.log(
      `✅ Groq инициализирован (ключ: ${apiKey.substring(0, 10)}... )`,
    );
    this.client = new Groq({ apiKey });
  }

  async generateQuiz(
    topic: string,
    numQuestions = 10,
    numAnswers = 4,
  ): Promise<Partial<CreateQuizDto>> {
    const prompt = `Сгенерируй ровно ${numQuestions} вопросов с множественным выбором на тему "${topic}". Каждый вопрос должен иметь ровно ${numAnswers} ответа, один из которых правильный. Верни ТОЛЬКО JSON следующей структуры:
  {
    "title": "Квиз: ${topic}",
    "description": "Сгенерированный квиз на тему ${topic}",
    "isActive": false,
    "questions": [
      {
        "text": "Текст вопроса",
        "order": 1,
        "answers": [
          { "text": "Вариант 1", "isCorrect": true, "points": 1 },
          { "text": "Вариант 2", "isCorrect": false, "points": 0 },
          { "text": "Вариант 3", "isCorrect": false, "points": 0 },
          { "text": "Вариант 4", "isCorrect": false, "points": 0 }
        ]
      }
    ]
  }
  ВАЖНО: Верни строго ВАЛИДНЫЙ JSON без лишних запятых, без Markdown и без пояснений.`;
  
    try {
      const completion = (await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000,
      })) as any;
  
      let response: string = completion?.choices?.[0]?.message?.content || '';
      response = response.trim();
  
      this.logger.log(`🧠 Raw ответ для "${topic}": ${response}`);
  
      // Очистка Markdown/оберток
      if (response.startsWith('```json')) response = response.slice(7).trim();
      else if (response.startsWith('```')) response = response.slice(3).trim();
      if (response.endsWith('```')) response = response.slice(0, -3).trim();
  
      try {
        const quiz = JSON.parse(response);
  
        if (!quiz.questions || !Array.isArray(quiz.questions)) {
          this.logger.error('❌ Некорректная структура: отсутствует массив "questions"');
          return { title: `Квиз: ${topic}`, questions: [] };
        }
  
        // Проверяем, что количество вопросов близко к ожидаемому
        if (quiz.questions.length < numQuestions) {
          this.logger.warn(
            `⚠️ Получено ${quiz.questions.length} вопросов вместо ${numQuestions}, но продолжаем обработку`,
          );
        }
  
        // Фильтруем вопросы, чтобы оставить только валидные
        const validQuestions = quiz.questions.filter((q: any, i: number) => {
          if (
            !q.text ||
            !Array.isArray(q.answers) ||
            q.answers.length !== numAnswers
          ) {
            this.logger.warn(`⚠️ Неверная структура вопроса: ${JSON.stringify(q)}`);
            return false;
          }
  
          const hasCorrectAnswer = q.answers.some((a: any) => a.isCorrect === true);
          if (!hasCorrectAnswer) {
            this.logger.warn(`⚠️ Вопрос без правильного ответа: ${q.text}`);
            return false;
          }
  
          return true;
        });
  
        if (validQuestions.length === 0) {
          this.logger.error('❌ Нет валидных вопросов после фильтрации');
          return { title: `Квиз: ${topic}`, questions: [] };
        }
  
        return {
          title: quiz.title || `Квиз: ${topic}`,
          description: quiz.description || `Сгенерированный квиз`,
          isActive: !!quiz.isActive,
          questions: validQuestions.map((q: any, i: number) => ({
            text: q.text || '',
            order: q.order || i + 1,
            image: q.image || null,
            answers: q.answers.map((a: any) => ({
              text: a.text || '',
              isCorrect: !!a.isCorrect,
              points: typeof a.points === 'number' ? a.points : a.isCorrect ? 1 : 0,
            })),
          })),
        };
      } catch (parseError) {
        this.logger.error('❌ Ошибка парсинга JSON');
        this.logger.debug('Raw JSON:', response);
        this.logger.error(parseError);
        return { title: `Квиз: ${topic}`, questions: [] };
      }
    } catch (error: any) {
      if (error.status === 401 || error.error?.code === 'invalid_api_key') {
        this.logger.error('🔑 Неверный API-ключ! Проверьте https://console.groq.com/keys');
      } else if (error.status === 400 && error.error?.code === 'model_decommissioned') {
        this.logger.error('🚫 Модель устарела — попробуйте qwen/qwen3-32b');
      } else if (error.status === 429) {
        this.logger.error('⏳ Превышен лимит запросов — попробуйте позже');
      }
  
      this.logger.error('❌ Ошибка при запросе к Groq API:', error);
      throw error;
    }
  }
}