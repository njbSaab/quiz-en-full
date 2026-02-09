// src/app/admin/pages/pages-edit/tabs-components/terms/terms.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface TermsItem {
  title: string;
  body: string;
}

interface TermsContent {
  title: string;
  subtitle: string;
  email: string;
  collapse: TermsItem[];
}

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss'
})
export class TermsComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  activeSectionIndex: number = 0;

  editableContent: TermsContent = {
    title: '',
    subtitle: '',
    email: 'privacy@votevibe.club',
    collapse: []
  };

  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    if (this.page?.content?.['terms']) {
      const terms = this.page.content['terms'];
      this.editableContent = {
        title: terms.title || 'terms',
        subtitle: terms.subtitle || '',
        email: terms.email || 'privacy@votevibe.club',
        collapse: (terms.collapse || []).map((item: any) => ({
          title: item.title || '',
          body: item.body || ''
        }))
      };
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
            terms: this.editableContent
          }
        };

        return this.pagesService.updatePage(this.page.id, patchData).pipe(
          catchError(err => {
            this.handleSaveError(err);
            return of(null); // продолжаем поток
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

  // Теперь возвращает Observable<Page>
  private saveToServer() {
    this.saving = true;
    this.saveStatus = 'saving';
    this.saveMessage = 'Сохранение...';

    // Отправляем ТОЛЬКО нужные поля
    const patchData = {
      title: this.page.title, // можно оставить как есть, или убрать если не меняется
      content: {
        ...this.page.content,
        terms: this.editableContent
      }
    };

    return this.pagesService.updatePage(this.page.id, patchData).pipe(
      catchError(err => {
        this.saving = false;
        this.saveStatus = 'error';
        this.saveMessage = 'Ошибка: ' + (err.error?.message || err.message || 'Неизвестная ошибка');
        console.error('Save error:', err);
        setTimeout(() => this.saveStatus = 'idle', 5000);
        return of(null); // чтобы цепочка не прерывалась
      })
    ).subscribe(savedPage => {
      if (savedPage) {
        this.saving = false;
        this.saveStatus = 'success';
        this.saveMessage = 'Сохранено успешно!';
        // Опционально: обновляем page из ответа
        Object.assign(this.page, savedPage);
        setTimeout(() => this.saveStatus = 'idle', 3000);
      }
    });
  }

  removeSection(index: number) {
    const sectionTitle = this.editableContent.collapse[index]?.title || 'этот раздел';
    if (confirm(`Удалить раздел "${sectionTitle}"?`)) {
      this.editableContent.collapse.splice(index, 1);

      // Корректируем активный индекс
      if (this.editableContent.collapse.length === 0) {
        this.activeSectionIndex = 0;
      } else if (this.activeSectionIndex >= this.editableContent.collapse.length) {
        this.activeSectionIndex = this.editableContent.collapse.length - 1;
      }

      this.onFieldChange();
    }
  }

  addSection() {
    this.editableContent.collapse.push({
      title: 'Новый раздел',
      body: 'Текст раздела...'
    });
    this.activeSectionIndex = this.editableContent.collapse.length - 1;
    this.onFieldChange();
  }

  setActiveSection(index: number) {
    this.activeSectionIndex = index;
  }

  private handleSaveSuccess(savedPage: Page) {
    this.saving = false;
    this.saveStatus = 'success';
    this.saveMessage = 'Сохранено успешно!';
    Object.assign(this.page, savedPage); // обновляем локальную копию
    setTimeout(() => this.saveStatus = 'idle', 3000);
  }

  private handleSaveError(err: any) {
    this.saving = false;
    this.saveStatus = 'error';
    this.saveMessage = 'Ошибка: ' + (err.error?.message || err.message || 'Неизвестная ошибка');
    console.error('Save error:', err);
    setTimeout(() => this.saveStatus = 'idle', 5000);
  }

  onFieldChange(auto: boolean = true) {
    this.saveStatus = 'idle';
    if (auto) {
      this.saveSubject.next();
    }
  }

  saveManually() {
    this.saveSubject.next();
  }
}