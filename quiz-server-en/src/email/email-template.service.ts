// src/email/email-template.service.ts
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailTemplateService {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.loadTemplate('quiz-result', 'quiz-result-email.template.html');
  }

  private loadTemplate(name: string, filename: string) {
    try {
      const path = join(__dirname, 'templates', filename);
      const content = readFileSync(path, 'utf-8');
      this.templates.set(name, content);
    } catch (error) {
      console.error(`Failed to load email template ${filename}:`, error);
    }
  }

  render(name: string, data: Record<string, any>): string {
    let template = this.templates.get(name);
    if (!template) return '';

    // Заменяем {{key}}
    for (const [key, value] of Object.entries(data)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return template;
  }
}