// src/app/admin/pages/pages-edit/tabs-components/thanks/thanks.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface FinishedContent {
  title: string;
  subtitle: string;
  buttonResults: string;
  buttonRestart: string;
  brandName: string;
  logo: string;
  confetti: boolean;
}

@Component({
  selector: 'app-thanks',
  templateUrl: './thanks.component.html',
  styleUrl: './thanks.component.scss'
})
export class ThanksComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  editableContent: FinishedContent = {
    title: '🎉 Congratulations 🎉',
    subtitle: '🥳 You have successfully completed the test. 🥳',
    buttonResults: 'View Results',
    buttonRestart: 'Start Over',
    brandName: 'VoteVibe',
    logo: 'https://i.ibb.co/Qvd3RYXX/5.png',
    confetti: true
  };
  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    if (this.page?.content?.['finished']) {
      const finished = this.page.content['finished'];
        this.editableContent = {
        title: finished.title || '🎉 Congratulations 🎉',
        subtitle: finished.subtitle || '🥳 You have successfully completed the test. 🥳',
        buttonResults: finished.buttonResults || 'View Results',
        buttonRestart: finished.buttonRestart || 'Start Over',
        brandName: finished.brandName || 'VoteVibe',
        logo: finished.logo || '',
        confetti: finished.confetti !== false // true by default
      };
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
            finished: this.editableContent
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
    console.error('Thanks save error:', err);
    setTimeout(() => this.saveStatus = 'idle', 5000);
  }
}