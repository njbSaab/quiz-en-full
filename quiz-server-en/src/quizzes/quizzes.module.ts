import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { PrismaService } from '../prisma.service';
import { EmailModule } from 'src/email/email.module';
import { QuizzesQueryService } from './quizzes.query.service';
import { CacheInterceptor } from 'src/common/interceptors/cache/cache.interceptor';
import { QuizMapper } from './mappers/quiz.mapper';
import { QuizzesCommandService } from './quizzes.command.service';

@Module({
  imports: [EmailModule], 
  controllers: [QuizzesController],
  providers: [
    // Основной сервис
    QuizzesService,

    // CQRS сервисы
    QuizzesQueryService, // Чтение
    QuizzesCommandService, // Запись

    // Вспомогательные
    QuizMapper,
    PrismaService,
    CacheInterceptor,
  ],
  exports: [QuizzesService, QuizzesQueryService], 
})
export class QuizzesModule {}