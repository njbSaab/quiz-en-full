import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PagesService } from '../../../core/services/pages.service';
import { Quiz } from '../../../core/interfaces/quiz.interface';

@Component({
  selector: 'app-quiz-finished',
  templateUrl: './quiz-finished.component.html',
  styleUrl: './quiz-finished.component.scss',
})
export class QuizFinishedComponent implements OnInit {
  @Input() quiz: Quiz | undefined;
  @Output() reset = new EventEmitter<void>();
  @Output() getResults = new EventEmitter<void>();

  text: any = {};

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    this.pagesService.getPage('thanks').subscribe(page => {
      this.text = page.content?.['finished'] || {};
    });
  }
}