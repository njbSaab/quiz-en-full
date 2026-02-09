import { Component, OnInit } from '@angular/core';
import { ScrollTopService } from '../../core/services/scroll-top.service';
import { PagesService } from '../../core/services/pages.service';
import { Page } from '../../core/interfaces/pages.interface';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent implements OnInit {
  quizCount = 0;
  page: Page | null = null;
  banner: Page | null = null;
  // Удобные геттеры для передачи в дочерние компоненты

  get privacyData() {
    return this.page?.content?.['faq'];
  }
  constructor(
    private scrollTop: ScrollTopService,
    private pagesService: PagesService,
  ) {}

  ngOnInit(): void {
    this.scrollTop.toTop();

    const stored = localStorage.getItem('quizCount');
    this.quizCount = stored ? Number(stored) : 0;

    // Один запрос — всё сразу!
    this.pagesService.getFaq().subscribe(page => {
      this.page = page;
    });

    this.pagesService.getHome().subscribe(page => {
      this.banner = page;
    });
  }
}