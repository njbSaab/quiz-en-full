export class EmailTemplateModel {
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

  // createdAt: Date;
  // updatedAt: Date;

  constructor(data: Partial<EmailTemplateModel>) {
    Object.assign(this, data);
  }

  isGlobal(): boolean {
    return this.quizId === null || this.quizId === undefined;
  }

  isQuizSpecific(): boolean {
    return this.quizId !== null && this.quizId !== undefined;
  }

  validate(): void {
    if (this.isGlobal() && (!this.app || !this.geo)) {
      throw new Error('Global email template must have app and geo');
    }
    if (this.isQuizSpecific() && (this.app || this.geo)) {
      throw new Error('Quiz-specific template should not have app/geo fields');
    }
  }
}