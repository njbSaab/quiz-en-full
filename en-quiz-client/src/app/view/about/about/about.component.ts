import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { PagesService } from '../../../core/services/pages.service';
import { ScrollTopService } from '../../../core/services/scroll-top.service';
import { Page } from '../../../core/interfaces/pages.interface';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit, AfterViewInit {
  page: Page | null = null;
  quizCount = 0;
  activeTab: string = 'cayn'; // по умолчанию первый

  @ViewChildren('collapse') collapses!: QueryList<ElementRef>;

  constructor(
    private pagesService: PagesService,
    private scrollTop: ScrollTopService
  ) {}

  ngOnInit(): void {
    this.scrollTop.toTop();

    const stored = localStorage.getItem('quizCount');
    this.quizCount = stored ? Number(stored) : 0;

    this.pagesService.getPage('about').subscribe(page => {
      this.page = page;
      // После загрузки данных — активируем первый таб
      this.activeTab = this.data?.tabs?.[0]?.id || 'cayn';
      setTimeout(() => this.updateBgClasses(), 100);
    });
  }

  ngAfterViewInit() {
    this.collapses.changes.subscribe(() => {
      this.updateBgClasses();
    });
  }

  get data() {
    return this.page?.content?.['about'];
  }

  // Клик по вкладке
  setActiveTab(tabId: string) {
    this.activeTab = tabId;
    this.updateBgClasses();
  }

  // Когда меняется radio (через collapse)
  onCollapseChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.activeTab = input.value;
      this.updateBgClasses();
    }
  }

  // Обновляем bg-shadow-*
  updateBgClasses() {
    if (!this.collapses) return;

    this.collapses.forEach((el: ElementRef) => {
      const div = el.nativeElement as HTMLElement;
      const input = div.querySelector('input') as HTMLInputElement;

      // Всегда убираем все тени
      div.classList.remove('bg-shadow-cayn', 'bg-shadow-fuchsia', 'bg-shadow-center');

      // Добавляем только активному по activeTab
      if (input && input.value === this.activeTab) {
        div.classList.add(`bg-shadow-${input.value}`);
      }
    });
  }
}