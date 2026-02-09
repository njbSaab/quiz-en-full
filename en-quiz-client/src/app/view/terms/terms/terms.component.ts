import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { PagesService } from '../../../core/services/pages.service';
import { ScrollTopService } from '../../../core/services/scroll-top.service';
import { Page } from '../../../core/interfaces/pages.interface';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss'
})
export class TermsComponent implements OnInit, AfterViewInit {
  @ViewChildren('collapse') collapses!: QueryList<ElementRef>;

  page: Page | null = null;

  constructor(
    private pagesService: PagesService,
    private scrollTop: ScrollTopService
  ) {}

  ngOnInit(): void {
    this.scrollTop.toTop();
    this.pagesService.getPage('terms').subscribe(page => {
      this.page = page;
      // После загрузки данных — обновим классы (первый будет checked по умолчанию)
      setTimeout(() => this.updateBgClasses());
    });
  }

  ngAfterViewInit() {
    // Может сработать до прихода данных — поэтому ещё раз вызовем в ngOnInit
    this.updateBgClasses();

    // Подписываемся на изменения ViewChildren (важно при *ngFor!)
    this.collapses.changes.subscribe(() => {
      this.updateBgClasses();
    });
  }

  // Это ВАЖНЫЙ обработчик — он срабатывает на нативное изменение radio
onCollapseChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const indexStr = input.getAttribute('data-index');
  if (!indexStr) return;

  const index = parseInt(indexStr, 10);
  const shadowClass = this.getShadowClass(index);

  // Убираем все тени
  this.collapses.forEach((el: ElementRef) => {
    const div = el.nativeElement as HTMLElement;
    div.classList.remove('bg-shadow-cayn', 'bg-shadow-center', 'bg-shadow-fuchsia');
  });

  // Добавляем нужную активному
  const activeCollapse = input.closest('.collapse');
  if (activeCollapse) {
    activeCollapse.classList.add(shadowClass);
  }
}

private getShadowClass(index: number): string {
  const classes = ['bg-shadow-cayn', 'bg-shadow-center', 'bg-shadow-fuchsia'];
  return classes[index % 3];
}

private updateBgClasses() {
  if (!this.collapses) return;

  this.collapses.forEach((el: ElementRef, index: number) => {
    const div = el.nativeElement as HTMLElement;
    const input = div.querySelector('input[type="radio"]') as HTMLInputElement;

    // Убираем все
    div.classList.remove('bg-shadow-cayn', 'bg-shadow-center', 'bg-shadow-fuchsia');

    // Добавляем первому или checked
    if (input?.checked || index === 0) {
      div.classList.add(this.getShadowClass(index));
    }
  });
}
}