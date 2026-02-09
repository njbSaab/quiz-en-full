// src/modules/quiz-results/quiz-results.module.ts

import { Module } from '@nestjs/common';
import { QuizResultsController } from './quiz-results.controller';
import { QuizResultsService } from './quiz-results.service';
import { QuizResultsQueryService } from './quiz-results.query.service';
import { QuizResultsCommandService } from './quiz-results.command.service';
import { QuizResultMapper } from './mappers/quiz-result.mapper';
import { PrismaService } from '../prisma.service';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { UsersModule } from 'src/users/users.module';

/**
 * Quiz Results Module
 * 
 * Creator (GRASP):
 * - Создает и связывает компоненты
 */
@Module({
  imports: [
    QuizzesModule, 
    UsersModule
  ],
  controllers: [QuizResultsController],
  providers: [
    QuizResultsService,
    QuizResultsQueryService,
    QuizResultsCommandService,
    QuizResultMapper,
    PrismaService,
  ],
  exports: [QuizResultsService, QuizResultsQueryService],
})
export class QuizResultsModule {}