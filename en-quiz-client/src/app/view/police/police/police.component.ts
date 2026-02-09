import { Component, OnInit } from '@angular/core';
import { ScrollTopService } from '../../../core/services/scroll-top.service';
import { PagesService } from '../../../core/services/pages.service';
import { Page } from '../../../core/interfaces/pages.interface';

@Component({
  selector: 'app-police',
  templateUrl: './police.component.html',
  styleUrl: './police.component.scss'
})
export class PoliceComponent  implements OnInit {
page: Page | null = null;
banner: Page | null = null;

  quizCount = 0;

  constructor(
    private pagesService: PagesService,
    private scrollTop: ScrollTopService
  ) {}

  ngOnInit(): void {
    this.scrollTop.toTop();

    const stored = localStorage.getItem('quizCount');
    this.quizCount = stored ? Number(stored) : 0;

    this.pagesService.getPage('policy').subscribe(page => {
      this.page = page;
    });

    this.pagesService.getHome().subscribe(page => {
      this.banner = page;
    });
  }

  get data() {
    return this.page?.content?.['policy'];
  }

  // Заменяем {{email}} на реальный email
  replaceEmail(text: string): string {
    if (!text) return '';
    return text.replace('{{email}}', this.data?.email || 'privacy@votevibe.club');
  }
}
