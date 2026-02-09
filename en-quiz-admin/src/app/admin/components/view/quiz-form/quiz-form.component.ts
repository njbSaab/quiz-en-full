// quiz-form.component.ts
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Quiz, QuizQuestion, QuizAnswer, QuizInfo } from '../../../../interfaces/quiz.interface';
import { QuizService } from '../../../../services/quiz.service';
import { NotificationService } from '../../../../services/notification.service';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ChaineEmailsTemplateService } from '../../../../services/chain-emails-template';
import { EmailTemplate } from '../../../../interfaces/email-template';
import { forkJoin } from 'rxjs'; 
export type QuizFormMode = 'create' | 'edit';
export type EmailTemplateMode = 'result' | 'chain'; 

@Component({
  selector: 'app-quiz-form',
  templateUrl: './quiz-form.component.html',
  styleUrls: ['./quiz-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizFormComponent implements OnInit {
  @Input() mode: QuizFormMode = 'create';
  @Input() quiz: Quiz | null = null;
  @Output() saved = new EventEmitter<Quiz>();
  @Output() cancelled = new EventEmitter<void>();

  formQuiz: Partial<Quiz> = this.getEmptyQuiz();
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;  
  selectedType: 'POINTS' | 'MAJORITY' = 'POINTS';
  isDraftLoaded: boolean = false; 
  selectedEmailMode: EmailTemplateMode = 'result';


  private quizIdForDraft: number | null = null;

private getLocalStorageKey(): string {
    if (this.mode === 'create') {
      return 'quizFormDraft_Create';
    }
    // Для edit — используем сохранённый ID
    return this.quizIdForDraft 
      ? `quizFormDraft_${this.quizIdForDraft}` 
      : 'quizFormDraft_Unknown'; // fallback, если ID потерян
  }

  constructor(
    private quizService: QuizService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private chaineEmailsTemplate: ChaineEmailsTemplateService
  ) {}

  ngOnInit(): void {
      if (this.mode === 'edit' && this.quiz) {
        this.formQuiz = this.deepCloneQuiz(this.quiz);
        this.quizIdForDraft = this.formQuiz.id || this.quiz?.id || null; // ← сохраняем ID
        this.selectedType = this.quiz.type || 'POINTS';

        // Загружаем черновик ТОЛЬКО если есть quizId
        if (this.quizIdForDraft) {
          this.loadQuizDraftFromLocal();
        }
      } else {
        this.selectedType = 'POINTS';
        this.loadQuizDraftFromLocal(); // для create — ключ 'quizFormDraft_Create'
      }
    }
  

  public defaultQuizInfo: QuizInfo = {
    firstText: 'Вы доказали, что можете разгадать даже самые сложные комбинации смайликов',
    secondText: 'Этот тест проверял не только память, но и интуицию — ведь не каждый догадается, что значит "Чарли и шоколадная фабрика"!',
    partnerBonus: 'Наши партнёры решили добавить в ваш "успешный фильм" особую сцену — с вами в главной роли',
    partnerBonus2: 'Не упустите свой момент — такие шансы бывают редко!',
    partnerBonus3: 'Нажмите на кнопку, зарегистрируйтесь и получите награду прямо сейчас',
    btnLink: 'https://1betgo.xyz/pmzC4m?to=3'
  };

  public defaultResultMessages_POINTS: Record<string, string> = {
    '0-4': 'Пора смотреть кино! Включайте "Аватар" или "Поезд в Пусан" — пусть новые истории вдохновят вас!',
    '4-7': 'Отличный результат! Вы настоящий киноманы! Ещё пара сеансов с попкорном — и вы станете мастером угадывания фильмов!',
    '8-8': '8/8 — Вы гуру вьетнамского и мирового кино! От корейских хорроров до голливудских блокбастеров — вам нет равных!'
  };

private loadQuizDraftFromLocal(): void {
  const key = this.getLocalStorageKey();
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const draft = JSON.parse(saved);

      // Перезаписываем только те поля, которые есть в черновике
      this.formQuiz = {
        ...this.formQuiz, // сохраняем оригинальный id и другие серверные поля
        title: draft.title ?? this.formQuiz.title,
        titleAdm: draft.titleAdm ?? this.formQuiz.titleAdm,
        quizShortTitle: draft.quizShortTitle ?? this.formQuiz.quizShortTitle,
        description: draft.description ?? this.formQuiz.description,
        descriptionAdm: draft.descriptionAdm ?? this.formQuiz.descriptionAdm,
        descrip: draft.descrip ?? this.formQuiz.descrip,
        firstPage: draft.firstPage ?? this.formQuiz.firstPage,
        finalPage: draft.finalPage ?? this.formQuiz.finalPage,
        previewImage: draft.previewImage ?? this.formQuiz.previewImage,
        isActive: draft.isActive ?? this.formQuiz.isActive,
        isMainView: draft.isMainView ?? this.formQuiz.isMainView,
        type: draft.type ?? this.formQuiz.type,
        rating: draft.rating ?? this.formQuiz.rating,
        quizInfo: draft.quizInfo ?? this.formQuiz.quizInfo,
        resultMessages: draft.resultMessages ?? this.formQuiz.resultMessages,
        questions: draft.questions 
          ? draft.questions.map((q: any) => ({
              ...q,
              answers: q.answers?.map((a: any) => ({ ...a })) || []
            }))
          : this.formQuiz.questions
      };

      this.isDraftLoaded = true;
      console.log(`📝 Loaded quiz draft from localStorage (${key})`, draft);
      this.cdr.markForCheck();
    } catch (e) {
      console.error('Invalid quiz draft in localStorage:', e);
      localStorage.removeItem(key);
      this.isDraftLoaded = false;
    }
  } else {
    this.isDraftLoaded = false;
  }
}

  private saveQuizDraftToLocal(): void {
    const key = this.getLocalStorageKey();
    // Сохраняем только изменённые поля (без id, createdAt и т.д.)
    const draftToSave = {
      title: this.formQuiz.title,
      titleAdm: this.formQuiz.titleAdm,
      quizShortTitle: this.formQuiz.quizShortTitle,
      description: this.formQuiz.description,
      descriptionAdm: this.formQuiz.descriptionAdm,
      descrip: this.formQuiz.descrip,
      firstPage: this.formQuiz.firstPage,
      finalPage: this.formQuiz.finalPage,
      previewImage: this.formQuiz.previewImage,
      isActive: this.formQuiz.isActive,
      isMainView: this.formQuiz.isMainView,
      type: this.formQuiz.type,
      rating: this.formQuiz.rating,
      quizInfo: this.formQuiz.quizInfo,
      resultMessages: this.formQuiz.resultMessages,
      questions: this.formQuiz.questions?.map(q => ({
        text: q.text,
        image: q.image,
        order: q.order,
        answers: q.answers?.map(a => ({ ...a }))
      }))
    };

    localStorage.setItem(key, JSON.stringify(draftToSave));
    console.log(`📝 Quiz draft saved to localStorage (${key})`);
  }

  clearQuizDraft(): void {
    const key = this.getLocalStorageKey();
    localStorage.removeItem(key);
    console.log(`Quiz draft cleared (${key})`);
  }

  public getEmptyQuiz(): Partial<Quiz> {
    return {
      title: '',
      titleAdm: '',
      quizShortTitle: 'unknown',
      description: '',
      descriptionAdm: '',
      descrip: '',
      firstPage: '',
      finalPage: '',
      previewImage: 'https://i.ibb.co/5X5Jxv13/quiz2.png',
      isActive: false,
      isMainView: false,
      type: 'POINTS',
      rating: 5,
      quizInfo: { ...this.defaultQuizInfo },
      resultMessages: { ...this.defaultResultMessages_POINTS },
      questions: [
        {
          text: '',
          order: 1,
          answers: this.getDefaultAnswersForType()
        },
      ],
    };
  }

  private deepCloneQuiz(quiz: Quiz): Partial<Quiz> {
    return {
      ...quiz,
      questions: quiz.questions?.map(q => ({
        ...q,
        answers: q.answers?.map(a => ({ ...a })) || [],
      })) || [],
    };
  }

  isValidImageUrl(url: string | undefined): boolean {
    if (!url?.trim()) return true;
    const currentOrigin = window.location.origin;
    const validDomains = [
      'https://i.ibb.co',    
      environment.baseUrl,
      currentOrigin,            
    ];
    return validDomains.some(domain => url.startsWith(domain)) 
      && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  }

  refreshImage(): void {
    if (this.formQuiz.previewImage && !this.isValidImageUrl(this.formQuiz.previewImage)) {
      this.notificationService.showError('Неверный URL изображения');
      this.formQuiz.previewImage = '';
    }
    this.cdr.markForCheck();
  }

  validateQuiz(): boolean {
    this.errorMessage = null;
  
    if (!this.formQuiz.title?.trim()) {
      this.showError('Название обязательно');
      return false;
    }
    if (!this.formQuiz.titleAdm?.trim()) {
      this.showError('Название для админа обязательно');
      return false;
    }
    if (!this.formQuiz.quizShortTitle?.trim()) {
      this.formQuiz.quizShortTitle = this.formQuiz.titleAdm;
    }
  
    for (const [i, q] of (this.formQuiz.questions || []).entries()) {
      if (!q.text?.trim()) {
        this.showError(`Вопрос ${i + 1}: текст обязателен`);
        return false;
      }
      if (!q.answers || q.answers.length < 1) {
        this.showError(`Вопрос ${i + 1}: нужен хотя бы 1 ответ`);
        return false;
      }
      for (const [j, a] of q.answers.entries()) {
        if (!a.text?.trim()) {
          this.showError(`Вопрос ${i + 1}, ответ ${j + 1}: текст обязателен`);
          return false;
        }
      }
    }
    return true;
  }

  save(): void {
    if (!this.validateQuiz()) {
      this.cdr.markForCheck();
      return;
    }

    // Перед отправкой — сохраняем черновик (на случай ошибки)
    this.saveQuizDraftToLocal();

    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;
    this.cdr.markForCheck();

    const action$ = this.mode === 'create'
      ? this.quizService.addQuiz(this.formQuiz)
      : this.quizService.updateQuiz(this.quiz!.id, this.formQuiz);

    action$.subscribe({
      next: (savedQuiz) => {
        this.isLoading = false;
        this.successMessage = this.mode === 'create' ? 'Квиз создан!' : 'Квиз обновлён!';
        this.errorMessage = null;

        // Сохраняем цепочку писем (как раньше)
        if (this.mode === 'create') {
          this.saveEmailChainDraft(savedQuiz.id);
        } else {
          // Для edit тоже можно отправить цепочку, если нужно
          // this.saveEmailChainDraft(savedQuiz.id);
        }

        // Успех — очищаем черновик
        this.clearQuizDraft();
        this.isDraftLoaded = false;
        this.saved.emit(savedQuiz);
        this.cdr.markForCheck();
        this.showTempMessage('success', this.mode === 'create' ? 'Квиз и письма сохранены!' : 'Квиз обновлён!');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка: ' + (err.message || 'Неизвестная ошибка');
        this.successMessage = null;
        this.cdr.markForCheck();
        this.isDraftLoaded = true;
      },
    });
  }

  // (ngModelChange)="onQuizChange()"
  onQuizChange(): void {
    if (this.mode === 'create' || this.mode === 'edit') {
      this.saveQuizDraftToLocal();
    }
  }
  /**
   * Сохранить цепочку follow-up из localStorage после создания квиза
   */
  private saveEmailChainDraft(quizId: number): void {
    const draftKey = 'quizEmailChainDraft';
    const savedDraft = localStorage.getItem(draftKey);

    if (!savedDraft) {
      console.log('Нет черновика цепочки — пропускаем');
      return;
    }

    try {
      let templates: EmailTemplate[] = JSON.parse(savedDraft);

      // Привязываем quizId ко всем шаблонам
      templates = templates.map(tpl => ({
        ...tpl,
        quizId, // ← главное изменение
      }));

      // Пакетно создаём на сервере
      const createObservables = templates.map(tpl =>
        this.chaineEmailsTemplate.create(tpl)
      );

      forkJoin(createObservables).subscribe({
        next: () => {
          // Успех — очищаем черновик
          localStorage.removeItem(draftKey);
          console.log(`Цепочка из ${templates.length} писем успешно сохранена для quiz #${quizId}`);
          this.notificationService.showSuccess(`Цепочка follow-up писем сохранена (${templates.length} шт)`);
        },
        error: (err) => {
          console.error('Ошибка при сохранении цепочки:', err);
          this.notificationService.showError('Не удалось сохранить follow-up письма');
        }
      });
    } catch (e) {
      console.error('Невалидный формат черновика:', e);
      this.notificationService.showError('Ошибка формата черновика писем');
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  addQuestion(): void {
    this.formQuiz.questions = this.formQuiz.questions || [];
    const newQuestion = {
      text: '',
      order: this.formQuiz.questions.length + 1,
      answers: this.getDefaultAnswersForType()
    };
    this.formQuiz.questions.push(newQuestion);
    this.cdr.markForCheck();
    this.onQuizChange();
  }

  addAnswer(qIndex: number): void {
    const question = this.formQuiz.questions![qIndex];
    const defaultAnswer = this.selectedType === 'MAJORITY'
      ? { text: '', isCorrect: true, points: Math.pow(10, question.answers.length) }
      : { text: '', isCorrect: false, points: 0 };

    question.answers.push(defaultAnswer);
    this.cdr.markForCheck();
    this.onQuizChange();
  }

  private getDefaultAnswersForType(): QuizAnswer[] {
    if (this.selectedType === 'MAJORITY') {
      return [
        { text: '', isCorrect: true, points: 1 },
        { text: '', isCorrect: true, points: 10 },
        { text: '', isCorrect: true, points: 100 },
        { text: '', isCorrect: true, points: 1000 }
      ];
    } else {
      return [
        { text: '', isCorrect: true, points: 3 },
        { text: '', isCorrect: true, points: 2 },
        { text: '', isCorrect: true, points: 1 },
        { text: '', isCorrect: false, points: 0 }
      ];
    }
  }

  removeQuestion(qIndex: number): void {
    this.formQuiz.questions!.splice(qIndex, 1);
    this.formQuiz.questions!.forEach((q, i) => q.order = i + 1);
    this.cdr.markForCheck();
  }

  removeAnswer(qIndex: number, aIndex: number): void {
    this.formQuiz.questions![qIndex].answers.splice(aIndex, 1);
    this.cdr.markForCheck();
  }

  clearForm(): void {
    this.formQuiz = this.getEmptyQuiz();
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  private showTempMessage(type: 'success' | 'error', msg: string) {
    if (type === 'success') {
      this.successMessage = msg;
      this.errorMessage = null;
    } else {
      this.errorMessage = msg;
      this.successMessage = null;
    }
    this.cdr.markForCheck();
  
    setTimeout(() => {
      if (type === 'success') this.successMessage = null;
      else this.errorMessage = null;
      this.cdr.markForCheck();
    }, 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    this.cdr.markForCheck();
  
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = null;
        this.cdr.markForCheck();
      }
    }, 5000);
  }

  switchType(type: 'POINTS' | 'MAJORITY'): void {
    this.selectedType = type;
    this.formQuiz.type = type;

    this.formQuiz.questions?.forEach(question => {
      question.answers = this.getDefaultAnswersForType();
    });

    this.cdr.markForCheck();
  }

  // ✅ Новый метод: переключение режима email-шаблона
  switchEmailMode(mode: EmailTemplateMode): void {
    this.selectedEmailMode = mode;
    this.cdr.markForCheck();
  }
    /**
   * Вызывается после сохранения email-шаблона
   */
  onEmailTemplateSaved(): void {
    console.log('✅ Email template saved successfully');
    this.successMessage = 'Email шаблон сохранён!';
    this.cdr.markForCheck();
    
    // Автоматически скрываем сообщение через 3 секунды
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.markForCheck();
    }, 3000);
  }
}
