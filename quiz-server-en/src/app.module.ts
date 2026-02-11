import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { QuizzesModule } from './quizzes/quizzes.module';
import { UsersModule } from './users/users.module';
import { ApiModule } from './api/api.module';
import { EmailModule } from './email/email.module';
import { EditContent } from './edit-content/edit-content.module';
import { LoggerModule } from './common/logger/logger.module';
import { CacheModule } from './common/chache/cache.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform/transform-interceptor.interceptor';
import {LoggingInterceptor} from './common/interceptors/logging/logging.interceptor';
import { QuizResultsModule } from './quiz-results/quiz-results.module';
import { EditEmailTemplateModule } from './edit-email-template/edit-email-template.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CacheModule,
    QuizzesModule,
    UsersModule,
    QuizResultsModule,
    ApiModule,
    EmailModule,
    EditContent,
    LoggerModule,
    EditEmailTemplateModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // Второй - отслеживает производительность
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor, // Третий - трансформирует ответы
    },
    PrismaService
  ],
  exports: [PrismaService],
})
export class AppModule {}