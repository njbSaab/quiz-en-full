// src/modules/quiz-results/quiz-results.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizResultsService } from './quiz-results.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { SecretWordGuard } from '../utils/guards/secret-word.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Quiz Results Controller
 * 
 * Controller (GRASP):
 * - Только маршрутизация HTTP
 */
@ApiTags('quiz-results')
@Controller('quiz-results')
export class QuizResultsController {
  constructor(private readonly quizResultsService: QuizResultsService) {}

  /**
   * POST /quiz-results/submit - Отправить результаты квиза
   */
  @Post('submit')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Отправить результаты квиза' })
  @HttpCode(HttpStatus.CREATED)
  async submitQuiz(@Body() dto: SubmitQuizDto) {
    return this.quizResultsService.submitQuiz(dto);
  }

  /**
   * GET /quiz-results/:id - Получить результат по ID
   */
  @Get(':id')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить результат по ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quizResultsService.findOne(id);
  }

  /**
   * GET /quiz-results/quiz/:quizId - Получить результаты по квизу
   */
  @Get('quiz/:quizId')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить результаты по квизу' })
  async findByQuizId(@Param('quizId', ParseIntPipe) quizId: number) {
    return this.quizResultsService.findByQuizId(quizId);
  }

  /**
   * GET /quiz-results/user/:userId - Получить результаты по пользователю
   */
  @Get('user/:userId')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить результаты по пользователю' })
  async findByUserId(@Param('userId') userId: string) {
    return this.quizResultsService.findByUserId(userId);
  }

  /**
   * GET /quiz-results/statistics/:quizId - Получить статистику
   */
  @Get('statistics/:quizId')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить статистику по квизу' })
  async getStatistics(@Param('quizId', ParseIntPipe) quizId: number) {
    return this.quizResultsService.getQuizStatistics(quizId);
  }

  /**
   * DELETE /quiz-results/:id - Удалить результат
   */
  @Delete(':id')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Удалить результат' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.quizResultsService.remove(id);
  }
}