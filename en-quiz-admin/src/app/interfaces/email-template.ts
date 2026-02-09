
export interface EmailTemplate {
  id?: number;
  app?: string | null;
  geo?: string | null;
  sequenceId: number;
  step: number;
  quizId?: number | null;
  subject: string;
  html: string;
  delayHours: number;
  bodyText?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailTemplateContent {
  titleText?: string;
  highlightText?: string;
  prizeText?: string;
  descriptionText?: string;
  callToAction?: string;
  btnLink: string;
}

