// quiz-single-page.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../../../services/quiz.service';
import { Quiz } from '../../../../interfaces/quiz.interface';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-quiz-single-page',
  templateUrl: './quiz-single-page.component.html',
  styleUrls: ['./quiz-single-page.component.scss'],
})
export class QuizSinglePageComponent implements OnInit {
  quiz: Quiz | null = null;
  loading = true;
  isLoading = false;
  errorMessage: string | null = null;
  isEditing = false;

  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadQuiz(id);
  }

  /**
   * ✅ ОБНОВЛЕНО: Используем админский метод БЕЗ кэша
   */
  loadQuiz(id: number): void {
    this.loading = true;

    // ✅ getQuizByIdAdmin() вместо getQuizById()
    this.quizService.getQuizByIdAdmin(id).subscribe({
      next: (quiz) => {
        this.quiz = quiz; // Всегда актуальные данные
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Ошибка загрузки: ' + err.message;
        this.notificationService.showError(this.errorMessage);
        this.loading = false;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  onSaved(updatedQuiz: Quiz): void {
    this.quiz = updatedQuiz;
    this.isEditing = false;
    this.notificationService.showSuccess('Квиз обновлён!');
    
    // ✅ Перезагружаем квиз чтобы показать актуальные данные
    if (this.quiz.id) {
      this.loadQuiz(this.quiz.id);
    }
  }

  onCancel(): void {
    this.isEditing = false;
    
    // ✅ Перезагружаем квиз чтобы сбросить изменения
    if (this.quiz?.id) {
      this.loadQuiz(this.quiz.id);
    }
  }

  deleteQuiz(): void {
    if (!this.quiz?.id) return;

    if (!confirm('Вы уверены, что хотите удалить этот квиз?')) return;

    this.isLoading = true;
    this.quizService.deleteQuiz(this.quiz.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showSuccess('Квиз удалён!');
        this.router.navigate(['/admin/all-quizes']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка удаления: ' + err.message;
        this.notificationService.showError(this.errorMessage);
      }
    });
  }
}