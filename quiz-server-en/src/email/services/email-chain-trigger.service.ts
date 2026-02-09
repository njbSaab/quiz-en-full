// src/modules/email/services/email-chain-trigger.service.ts

import { Injectable, Logger } from '@nestjs/common';

/**
 * Email Chain Trigger Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО триггер цепочки писем на внешнем сервере
 */
@Injectable()
export class EmailChainTriggerService {
  private readonly logger = new Logger(EmailChainTriggerService.name);

  /**
   * Триггерить цепочку писем (fire-and-forget)
   */
  async triggerChain(data: {
    userUuid: string;
    email: string;
    quizId: number;
    geo: string;
    name?: string;
  }): Promise<void> {
    const url = `${process.env.EMAIL_CHAIN_BASE_URL}/email-chain-quiz/trigger`;

    // Fire-and-forget: не блокируем основной поток
    this.sendWithRetry(url, data).catch((err) => {
      this.logger.error(
        `[CHAIN] Critical error (won't affect user): ${err.message}`,
      );
    });
  }

  /**
   * Отправка с retry
   */
  private async sendWithRetry(
    url: string,
    payload: any,
    attempt = 1,
  ): Promise<void> {
    const maxAttempts = 5;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        this.logger.log(
          `[CHAIN] Triggered successfully: ${payload.email} | quiz ${payload.quizId}`,
        );
        return;
      }

      if (response.status >= 500 && attempt < maxAttempts) {
        const delay = Math.min(1000 * 2 ** attempt, 30_000);
        this.logger.warn(
          `[CHAIN] Server returned ${response.status}, retry #${attempt + 1} in ${delay / 1000}s`,
        );
        await new Promise((r) => setTimeout(r, delay));
        return this.sendWithRetry(url, payload, attempt + 1);
      }

      this.logger.warn(
        `[CHAIN] Failed to trigger: ${response.status} ${response.statusText}`,
      );
    } catch (err: any) {
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * 2 ** attempt, 30_000);
        this.logger.warn(
          `[CHAIN] Connection error, retry #${attempt + 1}: ${err.message}`,
        );
        await new Promise((r) => setTimeout(r, delay));
        return this.sendWithRetry(url, payload, attempt + 1);
      }

      this.logger.error(
        `[CHAIN] Complete failure after ${maxAttempts} attempts: ${err.message}`,
      );
    }
  }
}