// quiz-all-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuizService } from '../../../services/quiz.service';
import { Quiz } from '../../../interfaces/quiz.interface';
import { NotificationService } from '../../../services/notification.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-quiz-all-page',
  templateUrl: './quiz-all-page.component.html',
  styleUrls: ['./quiz-all-page.component.scss']
})
export class QuizAllPageComponent implements OnInit, OnDestroy {
  quizzes: Quiz[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading: { [key: number]: boolean } = {}; // Объект для отслеживания загрузки по quiz.id
  isLoadingList = false;

  private successSub: Subscription;
  private errorSub: Subscription;

  constructor(
    private notificationService: NotificationService,
    private quizService: QuizService,
    private router: Router
  ) {
    this.successSub = this.notificationService.successMessage$.subscribe(
      (message) => (this.successMessage = message)
    );
    this.errorSub = this.notificationService.errorMessage$.subscribe(
      (message) => (this.errorMessage = message)
    );
  }

  ngOnInit(): void {
    this.loadQuizzes();
  }

  ngOnDestroy(): void {
    this.successSub.unsubscribe();
    this.errorSub.unsubscribe();
  }

  /**
   * ✅ ОБНОВЛЕНО: Используем админский метод БЕЗ кэша
   */
  loadQuizzes(): void {
    this.isLoadingList = true;

    // ✅ getQuizzesAdmin() вместо getQuizzes()
    this.quizService.getQuizzesAdmin().subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes; // Всегда актуальные данные
        this.isLoadingList = false;
      },
      error: (err) => {
        this.errorMessage = 'Ошибка загрузки квизов: ' + err.message;
        this.notificationService.showError(this.errorMessage);
        this.isLoadingList = false;
      }
    });
  }

  goToQuiz(id: number): void {
    console.log(`Navigating to quiz with ID: ${id}`);
    this.router.navigate(['/admin/quizzes', id]).then(success => {
      console.log(`Navigation to /admin/quizzes/${id} ${success ? 'succeeded' : 'failed'}`);
    });
  }

  deleteQuiz(quizId: number): void {
    if (confirm('Вы уверены, что хотите удалить этот квиз?')) {
      this.isLoading[quizId] = true;

      this.quizService.deleteQuiz(quizId).subscribe({
        next: () => {
          this.isLoading[quizId] = false;
          this.quizzes = this.quizzes.filter(quiz => quiz.id !== quizId);
          this.notificationService.showSuccess('Квиз успешно удален!');
        },
        error: (err) => {
          this.isLoading[quizId] = false;
          this.errorMessage = 'Ошибка удаления квиза: ' + err.message;
          this.notificationService.showError(this.errorMessage);
        }
      });
    }
  }

  toggleQuizActive(quizId: number, currentIsActive: boolean): void {
    this.isLoading[quizId] = true;
    this.quizService.toggleQuizActive(quizId).subscribe({
      next: (updated) => {
        this.isLoading[quizId] = false;
        this.quizzes = this.quizzes.map(q =>
          q.id === quizId ? updated : q
        );
        this.notificationService.showSuccess(
          `Квиз ${updated.isActive ? 'активирован' : 'деактивирован'}!`
        );
      },
      error: (err) => {
        this.isLoading[quizId] = false;
        this.notificationService.showError('Ошибка переключения статуса');
      }
    });
  }

  closeSuccessMessage(): void {
    this.notificationService.clearSuccess();
  }

  closeErrorMessage(): void {
    this.notificationService.clearError();
  }
}