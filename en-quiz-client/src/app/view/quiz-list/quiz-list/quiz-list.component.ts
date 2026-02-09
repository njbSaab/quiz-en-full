// src/app/features/quiz/quiz-list/quiz-list.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz } from '../../../core/interfaces/quiz.interface';
import { ScrollTopService } from '../../../core/services/scroll-top.service';
import { Page } from '../../../core/interfaces/pages.interface';
import { PagesService } from '../../../core/services/pages.service';

@Component({
  selector: 'app-quiz-list',
  templateUrl: './quiz-list.component.html',
  styleUrls: ['./quiz-list.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        query(
          '.quiz-item',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(100, [
              animate(
                '500ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class QuizListComponent implements OnInit {
  quizzes: Quiz[] = [];
  isvisible: boolean = true;
  filteredQuizzes: Quiz[] = [];
  showAll = false;
  page: Page | null = null;

  constructor(
    private quizService: QuizService,
    private cdr: ChangeDetectorRef,
    private scrollTop: ScrollTopService,
    private pagesService: PagesService
    // 🎯 Убрали ReferralService - не нужен здесь
  ) {}

  ngOnInit(): void {
    this.scrollTop.toTop();
    this.loadQuizzes();
    this.pagesService.getHome().subscribe((page) => {
      this.page = page;
    });
  }

  loadQuizzes(): void {
    this.quizService.getQuizzes().subscribe({
      next: (data: Quiz[]) => {
        this.quizzes = data.filter((q) => q.isActive);
        this.updateFilteredQuizzes();
      },
      error: (err) => console.error('❌ Ошибка загрузки квизов:', err),
    });
  }

  private updateFilteredQuizzes() {
    console.log('Все квизы:', this.quizzes);

    if (this.showAll) {
      this.filteredQuizzes = [...this.quizzes];
      console.log('Показываем ВСЕ:', this.filteredQuizzes.length);
    } else {
      this.filteredQuizzes = this.quizzes.filter(q => {
        const show = !!q.isMainView;
        console.log(`Квиз "${q.title}" → isMainView =`, q.isMainView, '→ показываем?', show);
        return show;
      });
      console.log('После фильтра isMainView:', this.filteredQuizzes.length);
    }

    this.cdr.markForCheck();
  }


  showAllQuizzes() {
    this.showAll = true;
    this.updateFilteredQuizzes();
    this.hideBanner();
  }
  

  hideBanner() {
    this.isvisible = false;
  }
}