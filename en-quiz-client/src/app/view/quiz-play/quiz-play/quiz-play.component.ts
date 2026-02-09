// src/app/view/quiz-play/quiz-play/quiz-play.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz, Question } from '../../../core/interfaces/quiz.interface';
import { QuizService } from '../../../core/services/quiz.service';
import { TimerService } from '../../../core/services/timer.service';
import { UserService } from '../../../core/services/user.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ScrollTopService } from '../../../core/services/scroll-top.service';
import { QuizStateService } from '../../../core/services/quiz-state.service';
import { QuizStorageService } from '../../../core/services/quiz-storage.service';
import { Subject, takeUntil, Observable } from 'rxjs';


@Component({
  selector: 'app-quiz-play',
  templateUrl: './quiz-play.component.html',
  styleUrls: ['./quiz-play.component.scss'],
  providers: [QuizStateService, QuizStorageService], // 🎯 Локальные провайдеры
  animations: [
    trigger('questionFadeIn', [
      transition(':increment', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('answerItem', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(30px) scale(0.92)' }),
      animate(
        '{{delay}}ms ease-out',
        style({ opacity: 1, transform: 'translateY(0) scale(1)' })
      ),
    ], { params: { delay: 0 } })
  ]),
  ],
})
export class QuizPlayComponent implements OnInit, OnDestroy {
  quiz: Quiz | undefined;
  questions: Question[] = [];
  isAnswerVisible = true;
  currentTime = 30;
  progress = 0;
  currentQuestionIndex$!: Observable<number>;
  isFinished$!: Observable<boolean>;

  private destroy$ = new Subject<void>();
  private sessionCreated = false;
  constructor(
    private quizService: QuizService,
    private route: ActivatedRoute,
    private timerService: TimerService,
    private userService: UserService,
    private router: Router,
    private layoutService: LayoutService,
    private scrollTop: ScrollTopService,
    private quizState: QuizStateService,
    private quizStorage: QuizStorageService,
  ) {
    this.currentQuestionIndex$ = this.quizState.currentQuestionIndex$;
    this.isFinished$ = this.quizState.isFinished$;
  }

  async ngOnInit(): Promise<void> {
    this.scrollTop.toTop();
    this.layoutService.hideHeaderFooter();

    const quizId = Number(this.route.snapshot.paramMap.get('id'));

    // 1. Загружаем квиз
    this.quizService.getQuizById(quizId).subscribe({
      next: async (quiz) => {
        if (!quiz || !quiz.questions.every(q => q.answers && q.answers.length > 0)) {
          console.error('❌ Некорректный квиз');
          this.router.navigate(['/quizzes']);
          return;
        }

        this.quiz = quiz;
        this.questions = quiz.questions;
        this.preloadImages();

        // 2. Загружаем сохраненный прогресс
        const savedState = this.quizStorage.loadProgress(quizId);
        this.quizState.initialize(this.questions.length, savedState || undefined);

        // 3. Подписываемся на изменения состояния
        this.subscribeToState(quizId);

        // 4. Создаем сессию ОДИН РАЗ (если еще не создана)
        if (!this.sessionCreated && !savedState) {
          await this.createSession(quizId);
          this.sessionCreated = true;
        }

        // 5. Запускаем таймер (если квиз не завершен)
        if (!this.quizState.isFinished) {
          this.timerService.startTimer();
        }
      },
      error: (error) => {
        console.error('❌ Ошибка загрузки квиза:', error);
        this.router.navigate(['/quizzes']);
      },
    });

    // Подписываемся на таймер
    this.timerService.currentTime$
      .pipe(takeUntil(this.destroy$))
      .subscribe(time => {
        this.currentTime = time;
        if (time <= 0 && !this.quizState.isFinished) {
          this.onTimeExpired();
        }
      });

    this.timerService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => this.progress = progress);
  }

  get currentQuestionImage(): string | null {
  const currentQ = this.questions[this.currentQuestionIndex];
  return currentQ?.image || null;
}
  ngOnDestroy(): void {
    this.layoutService.showHeaderFooter();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────────────────────────────────────────
  // ОБРАБОТКА ОТВЕТОВ
  // ────────────────────────────────────────────────────────────

onAnswerSelect(answer: any): void {
  const currentQuestion = this.questions[this.quizState.currentQuestionIndex];
  
  console.log('✅ Выбранный ответ:', answer);
  console.log('📊 Текущий вопрос:', currentQuestion);
  
  // 🎯 Вся логика подсчета в сервисе
  this.quizState.processAnswer(currentQuestion, answer);

  console.log('📈 Состояние после ответа:', {
    currentQuestionIndex: this.quizState.currentQuestionIndex,
    isFinished: this.quizState.isFinished,
    totalQuestions: this.questions.length,
  });

  // Сохраняем прогресс
  this.saveProgress();

  // UI эффекты
  this.timerService.stopTimer();
  this.isAnswerVisible = false;

  setTimeout(() => {
    if (!this.quizState.isFinished) {
      console.log('➡️ Переход к следующему вопросу');
      this.timerService.startTimer();
      this.isAnswerVisible = true;
    } else {
      console.log('🏁 Квиз завершен, вызываем onQuizFinished()');
      this.onQuizFinished();
    }
  }, 500);
}


  private onTimeExpired(): void {
    const currentQuestion = this.questions[this.quizState.currentQuestionIndex];
    
    // 🎯 Пропускаем вопрос
    this.quizState.skipQuestion(currentQuestion.id);

    // Сохраняем прогресс
    this.saveProgress();

    // UI эффекты
    this.timerService.stopTimer();
    this.isAnswerVisible = false;

    setTimeout(() => {
      if (!this.quizState.isFinished) {
        this.timerService.startTimer();
        this.isAnswerVisible = true;
      } else {
        this.onQuizFinished();
      }
    }, 500);
  }

  // ────────────────────────────────────────────────────────────
  // СОХРАНЕНИЕ
  // ────────────────────────────────────────────────────────────

  private saveProgress(): void {
    if (!this.quiz) return;
    
    const state = this.quizState.getState();
    this.quizStorage.saveProgress(this.quiz.id, state);
  }


private async onQuizFinished(): Promise<void> {
  if (!this.quiz) return;

  console.log('🏁 Квиз завершен, начинаем сохранение результатов...');

  this.timerService.stopTimer();
  this.quizStorage.markCompleted(this.quiz.id);

  const finalResult = {
    quizId: this.quiz.id,
    score: this.quizState.totalPoints,
    correctAnswersCount: this.quizState.correctAnswersCount,
    totalQuestions: this.questions.length,
    answers: this.quizState.answers.filter(a => a.answerId !== null),
  };

  console.log('📦 Финальный результат:', finalResult);

  // 1. Сохраняем в localStorage для отображения на странице результатов
  this.quizStorage.saveFinalResult(this.quiz.id, finalResult);
  console.log('💾 Результаты сохранены в localStorage');

  // 2. 🎯 ОТПРАВЛЯЕМ РЕЗУЛЬТАТЫ НА СЕРВЕР СРАЗУ
  try {
    console.log('📤 Отправляем результаты на сервер...');
    
    await this.userService.addUserResult({
      quizId: this.quiz.id,
      score: this.quizState.totalPoints,
      answers: this.quizState.answers.filter(a => a.answerId !== null),
      geo: 'vn',
    });

    console.log('✅ Результаты квиза отправлены на сервер');
  } catch (error) {
    console.error('❌ Ошибка отправки результатов:', error);
  }

  // 3. Очищаем прогресс (но НЕ final_result - нужен для отображения)
  this.quizStorage.clearProgress(this.quiz.id);
  console.log('🗑️ Прогресс очищен');
}


  // ────────────────────────────────────────────────────────────
  // СОЗДАНИЕ СЕССИИ
  // ────────────────────────────────────────────────────────────

  private async createSession(quizId: number): Promise<void> {
    const browserInfo = await this.userService.getBrowserInfo();

    await this.userService.saveUserSession({
      quizId,
      currentQuestionIndex: 0,
      correctAnswersCount: 0,
      totalPoints: 0,
      answers: [],
      browserInfo,
    });

    console.log('✅ Сессия создана для квиза', quizId);
  }

  // ────────────────────────────────────────────────────────────
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ────────────────────────────────────────────────────────────

  private subscribeToState(quizId: number): void {
    // Автосохранение при изменении состояния
    this.quizState.answers$
      .pipe(takeUntil(this.destroy$))
  }

  resetProgress(): void {
    if (!this.quiz) return;

    this.quizState.reset();
    this.quizStorage.clearAll(this.quiz.id);
    this.sessionCreated = false;
    this.timerService.startTimer();

    // Создаем новую сессию
    this.createSession(this.quiz.id);
  }

  getResults(): void {
    if (!this.quiz) return;
    this.router.navigate(['/quiz', this.quiz.id, 'result']);
  }

  private preloadImages(): void {
    for (const q of this.questions) {
      if (!q.image) continue;
      const img = new Image();
      img.src = q.image;
    }
  }

  // ────────────────────────────────────────────────────────────
  // ГЕТТЕРЫ ДЛЯ ШАБЛОНА
  // ────────────────────────────────────────────────────────────

  get currentQuestionIndex(): number {
    return this.quizState.currentQuestionIndex;
  }

  get isFinished(): boolean {
    return this.quizState.isFinished;
  }
}