import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { PrismaService } from 'src/prisma.service';
import {EmailSenderService} from './services/email-sender.service'
import {EmailTemplateService} from './services/email-template.service'
import {EmailChainTriggerService} from './services/email-chain-trigger.service'
import {CodeVerificationService} from './services/code-verification.service'

@Module({
  controllers: [EmailController],
  providers: [
    // Main orchestration service
    EmailService,

    // Specialized services
    EmailSenderService,           // SMTP отправка
    EmailTemplateService,         // HTML шаблоны
    CodeVerificationService,      // Генерация/верификация кодов
    EmailChainTriggerService,     // Триггер цепочки писем

    // Infrastructure
    PrismaService,
  ],
  exports: [EmailService], // Экспортируем для других модулей
})
export class EmailModule {}
