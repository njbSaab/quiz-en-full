import { Component, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';
interface QuizInfo {
  firstText?: string;
  secondText?: string;
  partnerBonus?: string;
  partnerBonus2?: string;
  partnerBonus3?: string;
  btnLink?: string;
}
@Component({
  selector: 'app-mail-template',
  templateUrl: './mail-template.component.html',
  styleUrl: './mail-template.component.scss'
})
export class MailTemplateComponent {
  resultMessageKeys: string[] = []; 
  @Input() type: 'POINTS' | 'MAJORITY' = 'POINTS';

  // Двусторонняя привязка
  @Input() quizInfo: QuizInfo = {};
  @Output() quizInfoChange = new EventEmitter<QuizInfo>();

  @Input() resultMessages: Record<string, string> = {};
  @Output() resultMessagesChange = new EventEmitter<Record<string, string>>();

  // Редактируемые копии
  editableQuizInfo: QuizInfo = {};
  editableResultMessages: Record<string, string> = {};

  previewResultMessage = 'Результат будет здесь...';
  previewDisplayValue = '';

  supMail = 'hello@votevibe.club';

  // Дефолтные русские значения
  private defaultQuizInfo: QuizInfo = {
    firstText: 'Вы доказали, что можете разгадать даже самые сложные комбинации смайликов',
    secondText: 'Этот тест проверял не только память, но и интуицию — ведь не каждый догадается, что значит "Чарли и шоколадная фабрика"!',
    partnerBonus: 'Наши партнёры решили добавить в ваш "успешный фильм" особую сцену — с вами в главной роли',
    partnerBonus2: 'Не упустите свой момент — такие шансы бывают редко!',
    partnerBonus3: 'Нажмите на кнопку, зарегистрируйтесь и получите награду прямо сейчас',
    btnLink: 'https://1betgo.xyz/pmzC4m?to=3'
  };

  private defaultResultMessages_POINTS = {
    '0-4': 'Пора смотреть кино! Включайте "Аватар" или "Поезд в Пусан" — пусть новые истории вдохновят вас!',
    '4-7': 'Отличный результат! Вы настоящий киноманы! Ещё пара сеансов с попкорном — и вы станете мастером угадывания фильмов!',
    '8-8': '8/8 — Вы гуру вьетнамского и мирового кино! От корейских хорроров до голливудских блокбастеров — вам нет равных!'
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type'] || changes['quizInfo'] || changes['resultMessages']) {
      this.initEditableData();
      this.updatePreview();
    }
  }

private initEditableData(): void {
  this.editableQuizInfo = { ...this.defaultQuizInfo, ...this.quizInfo };

  if (this.type === 'MAJORITY') {
    this.editableResultMessages = {
      '1': this.resultMessages['1'] || '',
      '2': this.resultMessages['2'] || '',
      '3': this.resultMessages['3'] || '',
      '4': this.resultMessages['4'] || ''
    };
    this.resultMessageKeys = ['1', '2', '3', '4'];
  } else {
    // POINTS — динамические ключи
    const savedKeys = Object.keys(this.resultMessages);
    if (savedKeys.length === 0 || !savedKeys.some(k => k.includes('-'))) {
      // Если ничего нет — дефолтные
      this.editableResultMessages = { ...this.defaultResultMessages_POINTS };
      this.resultMessageKeys = ['0-4', '4-7', '8-8'];
    } else {
      // Используем сохранённые + дефолтные как fallback
      this.editableResultMessages = { ...this.resultMessages };
      this.resultMessageKeys = savedKeys.length > 0 ? savedKeys : ['0-4', '4-7', '8-8'];
    }
  }
}

// Новая функция — добавление строки
addResultMessage(): void {
  if (this.type === 'MAJORITY') return; // запрещаем для MAJORITY

  const newKey = this.generateNextKey();
  this.resultMessageKeys.push(newKey);
  this.editableResultMessages[newKey] = '';
  this.onFieldChange();
}

// Удаление
removeResultMessage(key: string): void {
  if (this.type === 'MAJORITY') return;
  delete this.editableResultMessages[key];
  this.resultMessageKeys = this.resultMessageKeys.filter(k => k !== key);
  this.onFieldChange();
}

// Генерация следующего ключа (умная)
private generateNextKey(): string {
  const existing = this.resultMessageKeys
    .filter(k => k.includes('-'))
    .map(k => {
      const [min, max] = k.split('-').map(Number);
      return { key: k, min, max: max || min };
    })
    .sort((a, b) => a.max - b.max);

  if (existing.length === 0) return '0-4';

  const last = existing[existing.length - 1];
  const nextMin = last.max + 1;
  return `${nextMin}-${nextMin + 4}`;
}

  // Обновление превью
  updatePreview(): void {
    if (this.type === 'MAJORITY') {
      const filled = Object.entries(this.editableResultMessages).find(([_, v]) => v?.trim());
      this.previewDisplayValue = filled ? filled[0] : '1';
      this.previewResultMessage = filled?.[1] || 'Вы — уникальная личность!';
    } else {
      const key = Object.keys(this.editableResultMessages).find(k => k.includes('-')) || '0-4';
      this.previewResultMessage = this.editableResultMessages[key] || 'Отличный результат!';
    }
  }

  // Вызывается при любом изменении
  onFieldChange(): void {
    this.updatePreview();

    // Отправляем изменения наружу
    this.quizInfoChange.emit({ ...this.editableQuizInfo });
    this.resultMessagesChange.emit({ ...this.editableResultMessages });
  }
}
