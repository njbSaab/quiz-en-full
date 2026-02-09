// src/modules/email/services/code-verification.service.ts

import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

/**
 * Code Verification Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО генерация и верификация кодов
 */
@Injectable()
export class CodeVerificationService {
  private readonly secretKey: string;

  constructor() {
    if (!process.env.SECRET_KEY) {
      throw new Error('SECRET_KEY is not defined in .env');
    }
    this.secretKey = process.env.SECRET_KEY;
  }

  /**
   * Сгенерировать 6-значный код
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Зашифровать код
   */
  encryptCode(code: string): string {
    return CryptoJS.AES.encrypt(code, this.secretKey).toString();
  }

  /**
   * Расшифровать код
   */
  decryptCode(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, this.secretKey);
    const code = bytes.toString(CryptoJS.enc.Utf8);

    if (!code) {
      throw new Error('Invalid encrypted code');
    }

    return code;
  }

  /**
   * Проверить код
   */
  async verifyCode(encrypted: string, plainCode: string): Promise<boolean> {
    try {
      const decrypted = this.decryptCode(encrypted);
      return decrypted === plainCode;
    } catch {
      return false;
    }
  }
}