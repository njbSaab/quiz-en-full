import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Quiz } from '../../../interfaces/quiz.interface';

@Component({
  selector: 'app-added-page',
  templateUrl: './added-page.component.html',
  styleUrls: ['./added-page.component.scss'],
})
export class AddedPageComponent {

  constructor(private router: Router) {}

  onQuizSaved(quiz: Quiz): void {
    this.router.navigate(['/admin/quizzes', quiz.id]);
  }

  onCancel(): void {
    this.router.navigate(['/admin/all-quizes']);
  }
}