import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { QuizAIGeneratorService } from '../services/quiz-ai-generator.service';
import { CreateQuizDto } from 'src/quizzes/dto/create-quiz.dto';

@Controller('quiz-ai')
export class QuizAIGeneratorController {
  constructor(private quizAIGeneratorService: QuizAIGeneratorService) {}

  @Post('generate')
  async generateQuiz(
    @Body('topic') topic: string,
    @Body('numQuestions') numQuestions: string | number = 10, // Принимаем как строку или число
    @Body('numAnswers') numAnswers: string | number = 4 // Принимаем как строку или число
  ): Promise<{ success: boolean; quiz: Partial<CreateQuizDto> }> {
    if (!topic) {
      throw new HttpException('Тема квиза обязательна', HttpStatus.BAD_REQUEST);
    }
    const parsedNumQuestions = Number(numQuestions); // Приводим к числу
    const parsedNumAnswers = Number(numAnswers); // Приводим к числу
    if (isNaN(parsedNumQuestions) || parsedNumQuestions < 1 || parsedNumQuestions > 20) {
      throw new HttpException('Количество вопросов должно быть числом от 1 до 20', HttpStatus.BAD_REQUEST);
    }
    if (isNaN(parsedNumAnswers) || parsedNumAnswers < 2 || parsedNumAnswers > 4) {
      throw new HttpException('Количество ответов должно быть числом от 2 до 4', HttpStatus.BAD_REQUEST);
    }
    const quiz = await this.quizAIGeneratorService.generateQuiz(topic, parsedNumQuestions, parsedNumAnswers);
    return { success: true, quiz };
  }
}