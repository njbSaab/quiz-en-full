// src/modules/email/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailSenderService } from './services/email-sender.service';
import { EmailTemplateService } from './services/email-template.service';
import { CodeVerificationService } from './services/code-verification.service';
import { EmailChainTriggerService } from './services/email-chain-trigger.service';
import { EmailResultModel } from './models/email-result.model';

/**
 * Email Service - оркестрация
 * 
 * Controller (GRASP):
 * - Координирует все email-сервисы
 * - Применяет бизнес-правила через Domain Model
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly senderService: EmailSenderService,
    private readonly templateService: EmailTemplateService,
    private readonly codeService: CodeVerificationService,
    private readonly chainService: EmailChainTriggerService,
  ) {}


  // ────────────────────────────────────────────────────────────
  // ВЕРИФИКАЦИЯ КОДОВ
  // ────────────────────────────────────────────────────────────

  /**
   * Сгенерировать код
   */
  generateCode(): string {
    return this.codeService.generateCode();
  }

  /**
   * Зашифровать код
   */
  encryptCode(code: string): string {
    return this.codeService.encryptCode(code);
  }

  /**
   * Проверить код
   */
  async verifyCode(encrypted: string, plainCode: string): Promise<boolean> {
    return this.codeService.verifyCode(encrypted, plainCode);
  }

  /**
   * Расшифровать код (для внутренних нужд)
   */
  decryptCode(encrypted: string): string {
    return this.codeService.decryptCode(encrypted);
  }

  // ────────────────────────────────────────────────────────────
  // ОТПРАВКА EMAIL
  // ────────────────────────────────────────────────────────────

  /**
   * Отправить код верификации
   */
  async sendVerificationCode(
    email: string,
    code: string,
    siteUrl: string,
  ): Promise<void> {
    this.logger.log(`Sending verification code to ${email}`);

    const html = this.templateService.renderVerificationCode(code, siteUrl);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Mã xác minh email',
      html,
    };

    await this.senderService.send(mailOptions, `verification → ${email}`);
    this.logger.log(`Verification code sent to ${email}`);
  }

  /**
   * Отправить результаты квиза
   */
  async sendQuizResult(data: {
    email: string;
    quizId: number;
    sessionId: string;
    userName?: string;
    refSource?: string;
  }): Promise<{ sent: string[]; failed: string[] }> {
    this.logger.log(`Sending quiz results to ${data.email}`, {
      quizId: data.quizId,
      sessionId: data.sessionId,
    });

    // 1. Получаем результаты из БД
    const results = await this.getQuizResults(data.quizId, data.sessionId);

    if (results.length === 0) {
      this.logger.warn('No results found', {
        quizId: data.quizId,
        sessionId: data.sessionId,
      });
      return { sent: [], failed: [] };
    }

    const sent: string[] = [];
    const failed: string[] = [];

    // 2. Отправляем email для каждого результата
    for (const result of results) {
      try {
        await this.sendSingleQuizResult(result, data);
        sent.push(result.quiz.title);
        
        // 3. Триггерим цепочку писем
        await this.triggerEmailChain(result, data);
      } catch (err: any) {
        failed.push(`${result.quiz.title}: ${err.message}`);
        this.logger.error(`Failed to send email for quiz ${result.quizId}`, undefined, {
          error: err.message,
        });
      }
    }

    this.logger.log(`Email sending completed`, { sent: sent.length, failed: failed.length });
    return { sent, failed };
  }

  // ────────────────────────────────────────────────────────────
  // ПРИВАТНЫЕ МЕТОДЫ
  // ────────────────────────────────────────────────────────────

  /**
   * Получить результаты квиза из БД
   */
  private async getQuizResults(quizId: number, sessionId: string) {
    const where: any = { sessionId };
    
    if (quizId !== undefined && quizId !== null) {
      where.quizId = Number(quizId);
      this.logger.log(`Searching results by sessionId + quizId=${quizId}`);
    } else {
      this.logger.log(`Searching results by sessionId only`);
    }

    // 🎯 ИСПРАВЛЕНИЕ: Берем только 1 последний результат
    const results = await this.prisma.userResult.findMany({
      where,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            quizInfo: true,
            resultMessages: true,
            questions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Сначала самый свежий
      take: 1, // 🎯 Берем только 1 результат!
    });

    this.logger.log(`Found ${results.length} results`);
    return results;
  }

  /**
   * Отправить email для одного результата
   */
  private async sendSingleQuizResult(
    result: any,
    data: { email: string; userName?: string; refSource?: string },
  ): Promise<void> {
    const quiz = result.quiz;

    // Парсим answers
    let answersArray: any[] = [];
    if (result.answers) {
      try {
        answersArray =
          typeof result.answers === 'string'
            ? JSON.parse(result.answers as string)
            : (result.answers as any[]);
      } catch (e) {
        this.logger.warn('Failed to parse answers', undefined, { quizId: quiz.id });
      }
    }

    const correctCount = answersArray.filter((a: any) => a.isCorrect).length;

    // Парсим quizInfo и resultMessages
    let quizInfo: Record<string, any> = {};
    let resultMessages: Record<string, string> = {};

    if (quiz.quizInfo) {
      try {
        quizInfo = typeof quiz.quizInfo === 'string' 
          ? JSON.parse(quiz.quizInfo) 
          : quiz.quizInfo;
      } catch (e) {
        this.logger.warn('Failed to parse quizInfo', undefined, { quizId: quiz.id });
      }
    }

    if (quiz.resultMessages) {
      try {
        resultMessages = typeof quiz.resultMessages === 'string'
          ? JSON.parse(quiz.resultMessages)
          : quiz.resultMessages;
      } catch (e) {
        this.logger.warn('Failed to parse resultMessages', undefined, { quizId: quiz.id });
      }
    }

    // 🎯 Создаем доменную модель
    const emailResult = new EmailResultModel({
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizType: quiz.type,
      score: result.score,
      correctAnswers: correctCount,
      totalQuestions: quiz.questions.length,
      userEmail: data.email,
      userName: data.userName || data.email.split('@')[0] || 'bạn',
      refSource: data.refSource,
      quizInfo,
      resultMessages,
    });

    // 🎯 Применяем бизнес-логику через модель
    const textBlocks = emailResult.getTextBlocks();
    const partnerLink = emailResult.getPartnerLink();

    let resultMessage = '';
    if (quiz.type === 'MAJORITY') {
      const majorityResult = emailResult.getMajorityResult();
      resultMessage = majorityResult.message;
      this.logger.log(`[MAJORITY] Winner: ${majorityResult.winner}`, {
        quizId: quiz.id,
      });
    } else {
      const pointsResult = emailResult.getPointsResult();
      resultMessage = pointsResult.message;
    }

    // Рендерим HTML
    const html = this.templateService.renderQuizResult({
      userName: emailResult.userName,
      firstText: textBlocks.firstText,
      secondText: textBlocks.secondText,
      resultMessage,
      partnerBonus: textBlocks.partnerBonus,
      partnerBonus2: textBlocks.partnerBonus2,
      partnerBonus3: textBlocks.partnerBonus3,
      partnerLink,
    });

    // Отправляем
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: data.email,
      subject: `Chúc mừng! Bạn đã hoàn thành "${quiz.title}"`,
      html,
    };

    await this.senderService.send(mailOptions, `quiz result → ${data.email}`);
    this.logger.log(`Quiz result email sent`, {
      email: data.email,
      quizTitle: quiz.title,
      refSource: data.refSource,
    });
  }

  /**
   * Триггерить цепочку писем
   */
  private async triggerEmailChain(
    result: any,
    data: { email: string; userName?: string },
  ): Promise<void> {
    await this.chainService.triggerChain({
      userUuid: result.userId,
      email: data.email,
      quizId: result.quizId,
      geo: result.geo || 'UNKNOWN',
      name: data.userName,
    });

    this.logger.log(`Email chain triggered`, {
      email: data.email,
      quizId: result.quizId,
    });
  }
}