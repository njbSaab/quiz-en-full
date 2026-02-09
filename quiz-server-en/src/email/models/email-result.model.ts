// src/modules/email/models/email-result.model.ts

/**
 * Доменная модель Email Result
 * 
 * Information Expert (GRASP):
 * - Знает как форматировать результаты квиза
 * - Содержит бизнес-логику для email
 */
export class EmailResultModel {
  quizId: number;
  quizTitle: string;
  quizType: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  userEmail: string;
  userName: string;
  refSource?: string;
  quizInfo?: Record<string, any>;
  resultMessages?: Record<string, string>;

  constructor(data: Partial<EmailResultModel>) {
    Object.assign(this, data);
  }

  // ────────────────────────────────────────────────────────────
  // Бизнес-методы
  // ────────────────────────────────────────────────────────────

  /**
   * Получить процент правильных ответов
   */
  getAccuracyPercentage(): number {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }

  /**
   * Получить результат по типу MAJORITY (вес вариантов)
   */
  getMajorityResult(): { winner: string; displayValue: string; message: string } {
    const variantWeights: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
    let remaining = this.score;

    const weights = [1000, 100, 10, 1];
    for (const w of weights) {
      for (const v of ['4', '3', '2', '1']) {
        const add = Math.min(Math.floor(remaining / w), 8 - (variantWeights[v] || 0));
        if (add > 0) {
          variantWeights[v] = (variantWeights[v] || 0) + add;
          remaining -= add * w;
        }
      }
    }

    let winner = '1';
    let maxWeight = -1;
    for (const [v, weight] of Object.entries(variantWeights)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        winner = v;
      }
    }

    const message = this.resultMessages?.[winner] || '';

    return { winner, displayValue: winner, message };
  }

  /**
   * Получить результат по типу POINTS (диапазоны баллов)
   */
  getPointsResult(): { message: string; displayValue: string } {
    const message = this.getMessageByScore(this.score, this.resultMessages || {});
    return { message, displayValue: '' };
  }

  /**
   * Получить партнерскую ссылку с ref_source
   */
  getPartnerLink(): string {
    let btnLink = this.quizInfo?.btnLink || '';
    
    if (!btnLink || btnLink === '#') {
      return '#';
    }

    if (this.refSource && this.refSource.trim()) {
      const separator = btnLink.includes('?') ? '&' : '?';
      btnLink = `${btnLink}${separator}${this.refSource.trim()}`;
    }

    return btnLink;
  }

  /**
   * Получить текстовые блоки из quizInfo
   */
  getTextBlocks(): {
    firstText: string;
    secondText: string;
    partnerBonus: string;
    partnerBonus2: string;
    partnerBonus3: string;
  } {
    return {
      firstText: this.quizInfo?.firstText || '',
      secondText: this.quizInfo?.secondText || '',
      partnerBonus: this.quizInfo?.partnerBonus || this.quizInfo?.parnterBonus || '',
      partnerBonus2: this.quizInfo?.partnerBonus2 || this.quizInfo?.parnterBonus2 || '',
      partnerBonus3: this.quizInfo?.partnerBonus3 || this.quizInfo?.parnterBonus3 || '',
    };
  }

  /**
   * Получить сообщение по баллам (поддерживает диапазоны)
   */
  private getMessageByScore(score: number, messages: Record<string, string>): string {
    // 1. Точное совпадение: "8"
    const exactKey = score.toString();
    if (messages[exactKey]) {
      return messages[exactKey];
    }

    // 2. Диапазон: "0-4", "4-7"
    const rangeKey = Object.keys(messages).find((key) => {
      if (!key.includes('-')) return false;
      const [min, max] = key.split('-').map(Number);
      return score >= min && score <= max;
    });

    if (rangeKey && messages[rangeKey]) {
      return messages[rangeKey];
    }

    return '';
  }
}