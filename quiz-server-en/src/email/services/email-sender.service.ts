// src/modules/email/services/email-sender.service.ts

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Email Sender Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО отправка email через SMTP
 * - НЕ знает о бизнес-логике
 */
@Injectable()
export class EmailSenderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailSenderService.name);
  private transporter!: nodemailer.Transporter;

  /**
   * Инициализация SMTP пула
   */
  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 500,
      rateLimit: false,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 90000,
    } as nodemailer.TransportOptions);

    this.logger.log('SMTP pool initialized (Brevo)');
  }

  /**
   * Закрытие пула при остановке
   */
  onModuleDestroy() {
    this.transporter?.close();
    this.logger.log('SMTP pool closed');
  }

  /**
   * Отправить email с retry
   */
  async send(mailOptions: nodemailer.SendMailOptions, context: string): Promise<void> {
    return this.withRetry(
      () => this.transporter.sendMail(mailOptions),
      context,
    );
  }

  /**
   * Retry утилита
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    context: string,
    maxRetries = 6,
  ): Promise<T> {
    let lastError: any;

    for (let i = 1; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        this.logger.warn(
          `[RETRY ${i}/${maxRetries}] ${context}: ${err.message || err.code}`,
        );

        if (i < maxRetries) {
          const delay = i >= 5 ? 60000 : i === 4 ? 30000 : 2000 * i;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    this.logger.error(`[RETRY FAILED] ${context}`);
    throw lastError;
  }
}