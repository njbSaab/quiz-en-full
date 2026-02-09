
// dto/email-template.response.dto.ts

export class EmailTemplateResponseDto {     // ← добавь export здесь
  id: number;
  app?: string | null;
  geo?: string | null;
  sequenceId: number;
  step: number;
  quizId?: number | null;
  subject: string;
  html: string;
  delayHours: number;
  bodyText?: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(data: Partial<EmailTemplateResponseDto>) {
    Object.assign(this, data);
  }
}