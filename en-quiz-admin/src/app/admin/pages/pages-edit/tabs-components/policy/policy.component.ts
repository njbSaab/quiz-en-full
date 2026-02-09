// src/app/admin/pages/pages-edit/tabs-components/policy/policy.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface PolicyCard {
  title: string;
  body: string;
  color?: 'fuchsia' | 'center' | 'cayn';
}

interface PolicyContent {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  cards: PolicyCard[];
}

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrl: './policy.component.scss'
})
export class PolicyComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  editableContent: PolicyContent = {
    title: '',
    subtitle: '',
    ctaText: '立即開始...',
    ctaLink: '/quiz/3',
    cards: []
  };

  activeCardIndex: number = 0;

  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    if (this.page?.content?.['policy']) {
      const policy = this.page.content['policy'];
      this.editableContent = {
        title: policy.title || 'Policy',
        subtitle: policy.subtitle || '',
        ctaText: policy.ctaText || 'go to terms...',
        ctaLink: policy.ctaLink || '/quiz/3',
        cards: (policy.cards || []).map((card: any) => ({
          title: card.title || 'Новый пункт',
          body: card.body || '',
          color: card.color || this.getDefaultColor(policy.cards.length)
        }))
      };

      if (this.editableContent.cards.length > 0) {
        this.activeCardIndex = 0;
      }
    }

    this.saveSubject.pipe(
      debounceTime(1500),
      switchMap(() => {
        this.saving = true;
        this.saveStatus = 'saving';
        this.saveMessage = 'Сохранение...';

        const patchData = {
          title: this.page.title,
          content: {
            ...this.page.content,
            policy: this.editableContent
          }
        };

        return this.pagesService.updatePage(this.page.id, patchData).pipe(
          catchError(err => {
            this.handleSaveError(err);
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(savedPage => {
      if (savedPage) {
        this.handleSaveSuccess(savedPage);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFieldChange() {
    this.saveStatus = 'idle';
    this.saveSubject.next();
  }

  saveManually() {
    this.saveSubject.next();
  }

  private handleSaveSuccess(savedPage: Page) {
    this.saving = false;
    this.saveStatus = 'success';
    this.saveMessage = 'Сохранено успешно!';
    Object.assign(this.page, savedPage);
    setTimeout(() => this.saveStatus = 'idle', 3000);
  }

  private handleSaveError(err: any) {
    this.saving = false;
    this.saveStatus = 'error';
    this.saveMessage = 'Ошибка: ' + (err.error?.message || 'Неизвестная ошибка');
    console.error('Policy save error:', err);
    setTimeout(() => this.saveStatus = 'idle', 5000);
  }

  addCard() {
    this.editableContent.cards.push({
      title: 'Новый пункт',
      body: '<p>Текст пункта...</p>',
      color: this.getNextColor()
    });
    this.activeCardIndex = this.editableContent.cards.length - 1;
    this.onFieldChange();
  }

  removeCard() {
    if (this.editableContent.cards.length <= 1) {
      alert('Нельзя удалить последнюю карточку!');
      return;
    }
  
    if (confirm('Удалить эту карточку?')) {
      // Удаляем именно текущую активную карточку
      this.editableContent.cards.splice(this.activeCardIndex, 1);
  
      // Корректируем индекс
      if (this.activeCardIndex >= this.editableContent.cards.length) {
        this.activeCardIndex = this.editableContent.cards.length - 1;
      }
  
      this.onFieldChange();
    }
  }

  moveCardUp(index: number) {
    if (index > 0) {
      [this.editableContent.cards[index - 1], this.editableContent.cards[index]] =
        [this.editableContent.cards[index], this.editableContent.cards[index - 1]];
      if (this.activeCardIndex === index) this.activeCardIndex--;
      this.onFieldChange();
    }
  }

  moveCardDown(index: number) {
    if (index < this.editableContent.cards.length - 1) {
      [this.editableContent.cards[index], this.editableContent.cards[index + 1]] =
        [this.editableContent.cards[index + 1], this.editableContent.cards[index]];
      if (this.activeCardIndex === index) this.activeCardIndex++;
      this.onFieldChange();
    }
  }

  private getNextColor(): 'fuchsia' | 'center' | 'cayn' {
    const colors: ('fuchsia' | 'center' | 'cayn')[] = ['fuchsia', 'center', 'cayn'];
    return colors[this.editableContent.cards.length % 3];
  }

  private getDefaultColor(index: number): 'fuchsia' | 'center' | 'cayn' {
    const colors: ('fuchsia' | 'center' | 'cayn')[] = ['fuchsia', 'center', 'cayn'];
    return colors[index % 3];
  }

  getActiveCard() {
    return this.editableContent.cards[this.activeCardIndex];
  }

}