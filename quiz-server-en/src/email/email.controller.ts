// src/modules/email/email.controller.ts

import {
  Controller,
  Post,
  Body,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Email Controller
 * 
 * Controller (GRASP):
 * - Только маршрутизация HTTP
 * - Делегирует всю логику в Service
 */
@ApiTags('email')
@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * POST /email/send-code - Отправить код верификации
   */
  @Post('send-code')
  @ApiOperation({ summary: 'Отправить код верификации на email' })
  @ApiResponse({ status: 200, description: 'Код успешно отправлен' })
  @ApiResponse({ status: 500, description: 'Ошибка отправки' })
  async sendCode(@Body() dto: SendCodeDto) {
    this.logger.log(`Sending verification code to ${dto.email_user}`);

    try {
      // Генерируем и шифруем код
      const code = this.emailService.generateCode();
      const encryptedCode = this.emailService.encryptCode(code);

      // Отправляем email
      await this.emailService.sendVerificationCode(
        dto.email_user,
        code,
        dto.site_url,
      );

      this.logger.log(`Verification code sent successfully to ${dto.email_user}`);

      return {
        success: true,
        encrypted_code: encryptedCode,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send verification code to ${dto.email_user}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  /**
   * POST /email/verify - Верифицировать код и отправить результаты квиза
   */
  @Post('verify')
  @ApiOperation({ summary: 'Верифицировать код и отправить результаты квиза' })
  @ApiResponse({ status: 200, description: 'Код верифицирован, письма отправлены' })
  @ApiResponse({ status: 400, description: 'Неверный код' })
  @ApiResponse({ status: 500, description: 'Ошибка сервера' })
  async verify(@Body() dto: VerifyCodeDto) {
    this.logger.log(`Verifying code for ${dto.email_user}`, {
      sessionId: dto.session_id,
      quizId: dto.quiz_id,
    });

    // 1. Проверяем код
    const isValid = await this.emailService.verifyCode(
      dto.encrypted_code,
      dto.code,
    );

    if (!isValid) {
      this.logger.warn(`Invalid code for ${dto.email_user}`);
      throw new BadRequestException('Invalid verification code');
    }

    try {
      // 2. Расшифровываем для дополнительной проверки
      this.emailService.decryptCode(dto.encrypted_code);
    } catch {
      throw new BadRequestException('Invalid encrypted code');
    }

    try {
      // 3. Отправляем результаты квиза
      const result = await this.emailService.sendQuizResult({
        email: dto.email_user,
        quizId: dto.quiz_id!,
        sessionId: dto.session_id,
        userName: dto.name_user,
        refSource: dto.ref_source,
      });

      this.logger.log(`Quiz results sent to ${dto.email_user}`, {
        sent: result.sent.length,
        failed: result.failed.length,
      });

      return {
        success: true,
        message: 'Quiz results sent successfully',
        sent: result.sent,
        failed: result.failed,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send quiz results to ${dto.email_user}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to send quiz results');
    }
  }
}