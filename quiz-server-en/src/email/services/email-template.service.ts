// src/modules/email/services/email-template.service.ts

import { Injectable } from '@nestjs/common';

/**
 * Email Template Service
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО рендеринг HTML шаблонов
 */
@Injectable()
export class EmailTemplateService {
  /**
   * Рендер шаблона с кодом верификации
   */
  renderVerificationCode(code: string, siteUrl: string): string {
    const contentHtml = `
      <p>Chúng tôi đã nhận được yêu cầu xác minh email của bạn tại:</p>
      <p style="font-weight: 600; color: #1e40af;">${this.escape(siteUrl + '/quvi')}</p>
      <div class="code-box">${code}</div>
      <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
      <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
    `;

    return this.renderBaseTemplate(
      'Xác minh email',
      'Chào bạn!',
      contentHtml,
    );
  }

  /**
   * Рендер шаблона с результатами квиза
   */
  renderQuizResult(data: {
    userName: string;
    firstText: string;
    secondText: string;
    resultMessage: string;
    partnerBonus: string;
    partnerBonus2: string;
    partnerBonus3: string;
    partnerLink: string;
  }): string {
    const contentHtml = `
      <p style="font-size:20px;font-weight:700;color:#2c3e50;margin:10px 0 20px;">
        Xin chào, <span style="color:#d946ef;">${this.escape(data.userName)}</span>!<br>
        Chúc mừng bạn đã hoàn thành bài kiểm tra!
      </p>

      ${data.firstText ? `<p style="margin:12px 0;">${this.escape(data.firstText)}</p>` : ''}
      ${data.secondText ? `<p style="margin:12px 0;">${this.escape(data.secondText)}</p>` : ''}

      <!-- RESULT MESSAGE -->
      <div style="background:#f8f9fa;padding:20px;border-radius:10px;text-align:center;border-left:5px solid #667eea;margin:25px 0;">
        ${
          data.resultMessage
            ? `
          <div style="font-size:24px;font-weight:600;color:#2c3e50;margin-bottom:8px;">
            ${this.escape(data.resultMessage)}
          </div>
        `
            : ''
        }
      </div>

      <p style="margin:25px 0;">
        Chúng tôi còn nhiều câu đố thú vị hơn nữa - hãy thử sức với những câu đố khác nhé! 
        <a href="https://votevibe.club/quvi" style="color:#667eea;font-weight:600;text-decoration:none;">Làm các bài kiểm tra khác</a>
      </p>

      <!-- PARTNER BONUSES -->
      <div style="background:#f0f5ff;padding:15px;border-radius:10px;border-left:4px solid #d946ef;">
        ${data.partnerBonus ? `<div style="margin:20px 0;">${this.escape(data.partnerBonus)}</div>` : ''}
        ${data.partnerBonus2 ? `<div style="margin:10px 0;">${this.escape(data.partnerBonus2)}</div>` : ''}
        ${data.partnerBonus3 ? `<div style="margin:10px 0;">${this.escape(data.partnerBonus3)}</div>` : ''}

        ${
          data.partnerLink !== '#'
            ? `
          <div style="text-align:center;margin:30px 0;">
            <a href="${this.escape(data.partnerLink)}" 
               style="display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#f093fb,#f5576c);color:white;font-weight:600;font-size:18px;border-radius:12px;text-decoration:none;box-shadow:0 4px 15px rgba(240,147,251,0.4);">
              Nhận phần thưởng
            </a>
          </div>
        `
            : ''
        }
      </div>
    `;

    return this.renderBaseTemplate('', '', contentHtml);
  }

  /**
   * Базовый шаблон email
   */
  private renderBaseTemplate(
    title: string,
    greeting: string,
    contentHtml: string,
    footerText: string = 'Cảm ơn bạn đã tham gia! <a href="mailto:hello@votevibe.club">hello@votevibe.club</a>',
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${this.escape(title)}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(100deg, #d946ef, #67e8f9); color: white; padding: 30px; text-align: center; }
    .header img { height: 60px; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #2c3e50; margin-bottom: 20px; }
    .code-box { background: #f0f5ff; padding: 20px; border-radius: 10px; text-align: center; font-size: 28px; font-weight: 700; color: #1e40af; letter-spacing: 4px; margin: 20px 0; border: 2px dashed #93c5fd; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #777; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://i.ibb.co/QF0sMsFF/6.png" alt="VoteVibe" />
      <h1>${this.escape(title)}</h1>
    </div>
    <div class="content">
      ${greeting ? `<p class="greeting">${greeting}</p>` : ''}
      ${contentHtml}
    </div>
    <div class="footer">
      <p>${footerText}</p>
      <p>&copy; ${new Date().getFullYear()} VoteVibe. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Экранирование HTML
   */
  private escape(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}