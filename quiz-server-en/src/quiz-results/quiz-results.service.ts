// src/modules/quiz-results/quiz-results.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { QuizResultsQueryService } from './quiz-results.query.service';
import { QuizResultsCommandService } from './quiz-results.command.service';
import { QuizResultMapper } from './mappers/quiz-result.mapper';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizResultResponseDto } from './dto/quiz-result-response.dto';
import { QuizzesQueryService } from '../quizzes/quizzes.query.service';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Quiz Results Service - оркестрация
 * 
 * Controller (GRASP):
 * - Координирует Query и Command
 * - Применяет бизнес-правила
 */
@Injectable()
export class QuizResultsService {
  constructor(
    private readonly queryService: QuizResultsQueryService,
    private readonly commandService: QuizResultsCommandService,
    private readonly quizzesQueryService: QuizzesQueryService,
    private readonly mapper: QuizResultMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(QuizResultsService.name);
  }

  /**
   * Отправить результаты квиза
   */
  async submitQuiz(dto: SubmitQuizDto): Promise<QuizResultResponseDto> {
    this.logger.log('Submitting quiz', { quizId: dto.quizId });

    // Получаем квиз для resultMessages
    const quiz = await this.quizzesQueryService.findById(dto.quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${dto.quizId} not found`);
    }

    // Проверяем бизнес-правила
    if (!quiz.isPlayable()) {
      throw new NotFoundException(
        `Quiz with ID ${dto.quizId} is not playable`,
      );
    }

    // Создаем результат
    const model = await this.commandService.create(dto);

    // Отправляем ответ с сообщением из квиза
    return this.mapper.toResponse(model, quiz.resultMessages || undefined);
  }

  /**
   * Получить результат по ID
   */
  async findOne(id: number): Promise<QuizResultResponseDto> {
    this.logger.log('Finding result by ID', { id });

    const model = await this.queryService.findById(id);
    if (!model) {
      throw new NotFoundException(`Result with ID ${id} not found`);
    }

    // Получаем квиз для resultMessages
    const quiz = await this.quizzesQueryService.findById(model.quizId);

    return this.mapper.toResponse(model, quiz?.resultMessages || undefined);
  }

  /**
   * Получить результаты по квизу
   */
  async findByQuizId(quizId: number): Promise<QuizResultResponseDto[]> {
    this.logger.log('Finding results by quiz ID', { quizId });

    const models = await this.queryService.findByQuizId(quizId);

    // Получаем квиз для resultMessages
    const quiz = await this.quizzesQueryService.findById(quizId);

    return this.mapper.toResponseArray(
      models,
      quiz?.resultMessages || undefined,
    );
  }

  /**
   * Получить результаты по пользователю
   */
  async findByUserId(userId: string): Promise<QuizResultResponseDto[]> {
    this.logger.log('Finding results by user ID', { userId });

    const models = await this.queryService.findByUserId(userId);

    return models.map((model) =>
      this.mapper.toResponse(model, model.quiz?.resultMessages),
    );
  }

  /**
   * Получить статистику по квизу
   */
  async getQuizStatistics(quizId: number) {
    this.logger.log('Getting quiz statistics', { quizId });

    // Проверяем существование квиза
    const quiz = await this.quizzesQueryService.findById(quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    return this.queryService.getQuizStatistics(quizId);
  }

  /**
   * Удалить результат
   */
  async remove(id: number): Promise<{ message: string }> {
    this.logger.log('Deleting result', { id });

    const exists = await this.queryService.findById(id);
    if (!exists) {
      throw new NotFoundException(`Result with ID ${id} not found`);
    }

    await this.commandService.delete(id);

    return { message: `Result with ID ${id} deleted successfully` };
  }
}