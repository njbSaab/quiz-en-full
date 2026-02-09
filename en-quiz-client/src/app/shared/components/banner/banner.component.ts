// banner.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Page } from '../../../core/interfaces/pages.interface';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent {
  @Input() quizCount: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() showAll = new EventEmitter<void>(); 
  @Input() page: Page | null = null;
  
  onCloseClick() {
    this.close.emit();      // скрываем баннер
    this.showAll.emit();    // показываем все квизы
  }
}