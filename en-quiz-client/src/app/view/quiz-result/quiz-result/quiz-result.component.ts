// src/app/view/quiz-result/quiz-result/quiz-result.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { PagesService } from '../../../core/services/pages.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ReferralService } from '../../../core/services/referral.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-quiz-result',
  templateUrl: './quiz-result.component.html',
  styleUrls: ['./quiz-result.component.scss'],
})
export class QuizResultComponent implements OnInit, OnDestroy {
  myForm!: FormGroup;
  isCodeVisible = false;
  isSubmitting = false;
  isVerifying = false; // 🎯 Новый флаг для защиты от множественных кликов
  encryptedCode: string | null = null;

  tempName = '';
  tempEmail = '';

  correctAnswersCount = 0;
  totalPoints = 0;
  currentQuestionIndex = 0;
  quizId: number;
  answers: { questionId: number; answerId: number | null }[] = [];

  // Алерты
  isVisableAlert = false;
  showSuccess = false;
  showError = false;
  alertMessage = '';
  textAlert = false;
  successCodeText = false;

  private apiUrl = environment.apiUrl;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private pagesService: PagesService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private referralService: ReferralService,
  ) {
    this.quizId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.myForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      code: [''],
    });

    this.loadQuizData();

    this.pagesService.getPage('form')
      .pipe(takeUntil(this.destroy$))
      .subscribe((page) => {
        this.text = page.content?.['result'] || {};
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  text: any = {};

  private loadQuizData() {
    const finalResult = localStorage.getItem(`quiz_${this.quizId}_final_result`);
    
    if (finalResult) {
      const result = JSON.parse(finalResult);
      this.correctAnswersCount = result.correctAnswersCount || 0;
      this.totalPoints = result.score || 0;
      this.answers = result.answers || [];
      console.log('📦 Загружены данные из localStorage:', result);
    } else {
      console.warn('⚠️ Нет данных в localStorage для квиза', this.quizId);
    }
  }

  sendForm(): void {
    console.log('📧 [sendForm] Отправка кода верификации...');

    if (this.myForm.get('name')?.valid && this.myForm.get('email')?.valid) {
      this.isSubmitting = true;
      this.showError = false;

      this.tempName = this.myForm.get('name')?.value;
      this.tempEmail = this.myForm.get('email')?.value;

      this.http
        .post(`${this.apiUrl}/email/send-code`, {
          site_url: window.location.origin,
          email_user: this.tempEmail,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('✅ [sendForm] Код отправлен:', response);
            
            this.encryptedCode = response.data?.encrypted_code || response.encrypted_code;
            console.log('🔑 [sendForm] encryptedCode:', this.encryptedCode);
            
            this.isCodeVisible = true;
            this.myForm.get('code')?.setValidators(Validators.required);
            this.myForm.get('code')?.updateValueAndValidity();
            this.successCodeText = true;
          },
          error: (err) => {
            console.error('❌ [sendForm] Ошибка отправки кода:', err);
            this.showAlert('error', this.text.alertResendError || '哦，出錯了，我們再試一次。');
          },
          complete: () => {
            this.isSubmitting = false;
            console.log('🏁 [sendForm] Завершено');
          },
        });
    }
  }

  /**
   * Подтверждение кода и отправка данных
   */
/**
 * Подтверждение кода и отправка данных
 * 🎯 ОПТИМИЗАЦИЯ: Сначала отправляем email, потом обновляем юзера в фоне
 */
async submitFinalForm(): Promise<void> {
  console.log('🔐 [submitFinalForm] Начало валидации кода...');

  // 🎯 ЗАЩИТА: Если уже выполняется - выходим
  if (this.isVerifying) {
    console.warn('⚠️ [submitFinalForm] Уже выполняется, выход');
    return;
  }

  if (!this.myForm.valid || !this.encryptedCode || !this.tempName || !this.tempEmail) {
    console.warn('⚠️ [submitFinalForm] Валидация не прошла');
    return;
  }

  // 🎯 Устанавливаем флаги
  this.isVerifying = true;
  this.isSubmitting = true;
  this.showError = false;

  const code = this.myForm.get('code')?.value;
  const rawSource = this.referralService.getFullQuery();

  try {
    // 1️⃣ СНАЧАЛА ОТПРАВЛЯЕМ EMAIL (БЫСТРО - 2 сек)
    console.log('📨 [submitFinalForm] Отправка email с результатами...');

    await new Promise<void>((resolve, reject) => {
      this.http
        .post(`${this.apiUrl}/email/verify`, {
          site_url: window.location.origin,
          email_user: this.tempEmail,
          encrypted_code: this.encryptedCode,
          code: code,
          name_user: this.tempName,
          session_id: this.userService.getSessionId(),
          ref_source: rawSource || undefined,
          quiz_id: this.quizId,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            console.log('✅ [submitFinalForm] Email отправлен:', res);
            resolve();
          },
          error: (err) => reject(err),
        });
    });

    // 2️⃣ ПОКАЗЫВАЕМ SUCCESS POPUP СРАЗУ
    console.log('✨ [submitFinalForm] Показываем success popup');

    // GTM событие
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'form_submit_success',
      quiz_id: this.quizId,
      user_name: this.tempName,
      user_email: this.tempEmail,
      geo: 'vn',
      action: 'quiz_completed',
      timestamp: new Date().toISOString(),
    });

    // Очистка
    localStorage.removeItem(`quiz_${this.quizId}_final_result`);
    localStorage.removeItem(`quiz_${this.quizId}_id`);

    this.showAlert('success', '謝謝！結果已儲存並發送到您的電子郵件。');

    // 3️⃣ В ФОНЕ ОБНОВЛЯЕМ ЮЗЕРА (НЕ БЛОКИРУЕТ UI)
    console.log('🎯 [submitFinalForm] Обновление юзера в фоне...');
    
    this.updateUserInBackground(this.tempName, this.tempEmail);

  } catch (error: any) {
    console.error('❌ [submitFinalForm] Ошибка:', error);
    
    if (error.status === 400) {
      this.showAlert('error', '驗證碼錯誤。請再試一次。');
    } else {
      this.showAlert('error', '發送電子郵件時發生錯誤。請再試一次。');
    }
  } finally {
    this.isVerifying = false;
    this.isSubmitting = false;
    console.log('🏁 [submitFinalForm] Завершено');
  }
}

/**
 * Обновить юзера в фоне (не блокирует UI)
 */
private updateUserInBackground(name: string, email: string): void {
  this.userService.addUser({
    name: name,
    email: email,
    geo: 'vn',
  }).then(addUserObservable => {
    addUserObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        console.log('✅ [Background] Пользователь обновлен');
      },
      error: (err) => {
        console.warn('⚠️ [Background] Ошибка обновления юзера (не критично):', err);
        // НЕ показываем ошибку пользователю, т.к. email уже отправлен
      },
    });
  }).catch(err => {
    console.warn('⚠️ [Background] Ошибка создания observable:', err);
  });
}

  resendCode(): void {
    if (!this.tempEmail) return;

    this.isSubmitting = true;
    this.http
      .post(`${this.apiUrl}/email/send-code`, {
        site_url: window.location.origin,
        email_user: this.tempEmail,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showAlert('success', this.text.alertCodeResent || '驗證碼已重新發送！');
        },
        error: () => {
          this.showAlert('error', this.text.alertResendError || '無法重新發送驗證碼。請再試一次。');
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
  }

  clickAfterSuccess() {
    this.isVisableAlert = false;
    this.showSuccess = false;
    setTimeout(() => this.router.navigate(['/quizzes']), 300);
  }

  showErrorfalse() {
    this.isVisableAlert = false;
  }

  private showAlert(type: 'success' | 'error', message: string) {
    this.alertMessage = message;
    if (type === 'success') {
      this.showSuccess = true;
      this.showError = false;
    } else {
      this.showError = true;
      this.showSuccess = false;
    }
  }
}