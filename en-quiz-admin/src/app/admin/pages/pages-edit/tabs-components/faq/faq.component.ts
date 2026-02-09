// src/app/admin/pages/pages-edit/tabs-components/faq/faq.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqContent {
  title: string;
  subtitle: string;
  faq: FaqItem[];
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  editableContent: FaqContent = {
    title: '',
    subtitle: '',
    faq: []
  };

  activeFaqIndex: number = 0;

  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    if (this.page?.content?.['privacy']) {
      const faqData = this.page.content['privacy'];
      this.editableContent = {
        title: faqData.title || 'Privacy',
        subtitle: faqData.subtitle || '',
        faq: (faqData.faq || []).map((item: any) => ({
          question: item.question || 'Новый вопрос',
          answer: item.answer || '<p>Ответ...</p>'
        }))
      };

      if (this.editableContent.faq.length > 0) {
        this.activeFaqIndex = 0;
      }
    }

    // Автосохранение
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
            privacy: this.editableContent
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
    console.error('FAQ save error:', err);
    setTimeout(() => this.saveStatus = 'idle', 5000);
  }

  addFaq() {
    this.editableContent.faq.push({
      question: 'Новый вопрос',
      answer: '<p>Ответ на вопрос...</p>'
    });
    this.activeFaqIndex = this.editableContent.faq.length - 1;
    this.onFieldChange();
  }

  removeFaq(index: number) {
    if (confirm('Удалить этот вопрос?')) {
      this.editableContent.faq.splice(index, 1);
      if (this.activeFaqIndex >= this.editableContent.faq.length) {
        this.activeFaqIndex = Math.max(0, this.editableContent.faq.length - 1);
      }
      this.onFieldChange();
    }
  }

  moveFaqUp(index: number) {
    if (index > 0) {
      [this.editableContent.faq[index - 1], this.editableContent.faq[index]] =
        [this.editableContent.faq[index], this.editableContent.faq[index - 1]];
      if (this.activeFaqIndex === index) this.activeFaqIndex--;
      this.onFieldChange();
    }
  }

  moveFaqDown(index: number) {
    if (index < this.editableContent.faq.length - 1) {
      [this.editableContent.faq[index], this.editableContent.faq[index + 1]] =
        [this.editableContent.faq[index + 1], this.editableContent.faq[index]];
      if (this.activeFaqIndex === index) this.activeFaqIndex++;
      this.onFieldChange();
    }
  }

  getActiveFaq() {
    return this.editableContent.faq[this.activeFaqIndex];
  }
}