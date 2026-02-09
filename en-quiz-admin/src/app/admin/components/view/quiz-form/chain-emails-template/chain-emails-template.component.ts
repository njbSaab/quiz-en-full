import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { EmailTemplate, EmailTemplateContent } from '../../../../../interfaces/email-template';
import { ChaineEmailsTemplateService } from '../../../../../services/chain-emails-template';

@Component({
  selector: 'app-chain-emails-template',
  templateUrl: './chain-emails-template.component.html',
  styleUrls: ['./chain-emails-template.component.scss']
})
export class ChainEmailsTemplateComponent implements OnInit {
  @Input() quizId: number | undefined; // undefined при создании квиза
  @Input() quizTitle: string = 'Quiz';
  @Output() saved = new EventEmitter<void>();

  templates: EmailTemplate[] = [];
  selectedTemplate: EmailTemplate | null = null;
  editableContent!: EmailTemplateContent;

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  previewName = 'John';
  currentYear = new Date().getFullYear();
  helloMail = 'hello@votevibe.club';

  private localStorageKey = 'quizEmailChainDraft';

  constructor(
    private chaineEmailsTemplate: ChaineEmailsTemplateService,
    private cdr: ChangeDetectorRef
  ) {}

  private getLocalStorageKey(): string {
    return this.quizId 
      ? `quizEmailChainDraft_${this.quizId}` // уникальный ключ для edit (по quizId)
      : 'quizEmailChainDraft'; // общий для create
  }

  ngOnInit(): void {
    this.editableContent = this.chaineEmailsTemplate.getDefaultContent();

    if (this.quizId) {
      // Режим edit — сначала пытаемся загрузить локальный черновик, если нет — с сервера
      this.loadFromLocalStorage();
      if (this.templates.length === 0) {
        this.loadTemplatesFromServer();
      }
    } else {
      // Режим create — только локальный черновик или дефолт
      this.loadFromLocalStorage();
      if (this.templates.length === 0) {
        this.templates = this.getDefaultEmailChain();
      }
    }

    if (this.templates.length > 0) {
      this.selectTemplate(this.templates[0]);
    }
  }

  // ────────────────────────────────────────────────────────────
  // Работа с localStorage (для обоих режимов)
  // ────────────────────────────────────────────────────────────

  private loadFromLocalStorage(): void {
    const key = this.getLocalStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        this.templates = JSON.parse(saved);
        console.log(`📧 Loaded draft from localStorage (${key})`);
      } catch (e) {
        console.error('Invalid draft in localStorage:', e);
        localStorage.removeItem(key);
        this.templates = [];
      }
    }
  }

  private saveToLocalStorage(): void {
    const key = this.getLocalStorageKey();
    localStorage.setItem(key, JSON.stringify(this.templates));
    console.log(`📧 Draft saved to localStorage (${key})`);
  }

  clearLocalDraft(): void {
    const key = this.getLocalStorageKey();
    if (confirm('Очистить черновик цепочки писем?')) {
      localStorage.removeItem(key);
      this.templates = this.getDefaultEmailChain();
      if (this.templates.length > 0) {
        this.selectTemplate(this.templates[0]);
      }
      this.successMessage = 'Черновик очищен!';
      this.clearMessagesAfterDelay();
    }
  }

  // ────────────────────────────────────────────────────────────
  // Загрузка с сервера (только для edit, если нет черновика)
  // ────────────────────────────────────────────────────────────

  private loadTemplatesFromServer(): void {
    if (!this.quizId) return;

    this.isLoading = true;
    this.chaineEmailsTemplate.getByQuiz(this.quizId).subscribe({
      next: (templates) => {
        this.templates = templates.length > 0 
          ? templates.sort((a, b) => a.sequenceId - b.sequenceId || a.step - b.step)
          : this.getDefaultEmailChain();

        if (this.templates.length > 0) {
          this.selectTemplate(this.templates[0]);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Ошибка загрузки шаблонов: ' + err.message;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // Дефолтная цепочка (всегда локальная при создании)
  // ────────────────────────────────────────────────────────────

  private getDefaultEmailChain(): EmailTemplate[] {
    return [
      {
        quizId: this.quizId || 0,
        sequenceId: 1,
        step: 1,
        subject: `🎉 ${this.quizTitle} — твои результаты уже готовы!`,
        html: '',
        delayHours: 1,
        bodyText: JSON.stringify({
          titleText: "Ты круто прошёл квиз!",
          highlightText: `Твой результат в «${this.quizTitle}» — огонь! 🔥`,
          prizeText: "Твой подарок ждёт тебя 🏆🎁",
          descriptionText: "Ты проявил отличные знания, юмор и скорость. Поздравляем!",
          callToAction: "Забери приз прямо сейчас — он не будет ждать вечно!",
          btnLink: "https://1betgo.xyz/pmzC4m?to=6"
        })
      },
      {
        quizId: this.quizId || 0,
        sequenceId: 1,
        step: 2,
        subject: `{{name}}, твой приз всё ещё ждёт! ⏳`,
        html: '',
        delayHours: 24,
        bodyText: JSON.stringify({
          titleText: "Не забудь забрать награду!",
          highlightText: "Мы видим, что ты прошёл квиз, но ещё не забрал приз...",
          prizeText: "Это твой заслуженный подарок 🎁",
          descriptionText: "Такие предложения долго не живут — действуй!",
          callToAction: "Забрать приз →",
          btnLink: "https://1betgo.xyz/pmzC4m?to=6"
        })
      },
      {
        quizId: this.quizId || 0,
        sequenceId: 1,
        step: 3,
        subject: `Последний шанс забрать приз от «${this.quizTitle}»!`,
        html: '',
        delayHours: 72,
        bodyText: JSON.stringify({
          titleText: "Это действительно последний шанс...",
          highlightText: "Твой приз скоро уйдёт другому счастливчику",
          prizeText: "🏆 Не упусти!",
          descriptionText: "Ты был очень близко — осталось только кликнуть!",
          callToAction: "Забрать сейчас!",
          btnLink: "https://1betgo.xyz/pmzC4m?to=6"
        })
      }
    ] as EmailTemplate[];
  }

  // ────────────────────────────────────────────────────────────
  // Выбор и редактирование
  // ────────────────────────────────────────────────────────────

  selectTemplate(template: EmailTemplate): void {
    this.selectedTemplate = template; // прямая ссылка
    this.editableContent = this.chaineEmailsTemplate.parseBodyText(template.bodyText);
    this.cdr.markForCheck();
    this.saveToLocalStorage(); // сохраняем сразу
  }

  onContentChange(): void {
    if (this.selectedTemplate) {
      this.selectedTemplate.bodyText = this.chaineEmailsTemplate.stringifyContent(this.editableContent);
      // Поскольку прямая ссылка — массив уже обновлён
    }
    this.cdr.markForCheck();
    this.saveToLocalStorage(); // сохраняем изменения
  }

  // ────────────────────────────────────────────────────────────
  // Добавление нового письма
  // ────────────────────────────────────────────────────────────

  addNewTemplate(): void {
    const newTemplate: EmailTemplate = {
      quizId: this.quizId || 0,
      sequenceId: this.getNextSequenceId(),
      step: 1,
      subject: `Новое письмо #${this.getNextSequenceId()}`,
      html: '',
      delayHours: 24,
      bodyText: this.chaineEmailsTemplate.stringifyContent(this.chaineEmailsTemplate.getDefaultContent())
    };

    this.templates.push(newTemplate);
    this.selectTemplate(newTemplate);
    this.successMessage = 'Новый шаблон добавлен в черновик';
    this.clearMessagesAfterDelay();
    this.saveToLocalStorage();
  }

  private getNextSequenceId(): number {
    return this.templates.length > 0 
      ? Math.max(...this.templates.map(t => t.sequenceId || 0)) + 1 
      : 1;
  }

  // ────────────────────────────────────────────────────────────
  // Удаление
  // ────────────────────────────────────────────────────────────

  deleteTemplate(template: EmailTemplate): void {
    if (confirm(`Удалить письмо ${template.sequenceId}.${template.step}?`)) {
      this.templates = this.templates.filter(t => t !== template);

      if (this.selectedTemplate === template) {
        this.selectedTemplate = this.templates[0] || null;
        if (this.selectedTemplate) this.selectTemplate(this.selectedTemplate);
      }

      this.successMessage = 'Шаблон удалён из черновика';
      this.clearMessagesAfterDelay();
      this.saveToLocalStorage();
    }
  }

  // ────────────────────────────────────────────────────────────
  // Утилиты
  // ────────────────────────────────────────────────────────────

  getTemplateName(template: EmailTemplate): string {
      return `#${template.sequenceId}.${template.step} (${template.delayHours}ч) - ${template.subject.substring(0, 40)}${template.subject.length > 40 ? '...' : ''}`;
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
      this.cdr.markForCheck();
    }, 5000);
  }
}