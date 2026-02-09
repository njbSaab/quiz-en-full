// home.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface BannerContent {
  title: string;
  subtitle: string;
  playBtn: { text: string };
  listQsBtn: { text: string };
}

interface HomeContent {
  backgroundImage: string;
  banner: BannerContent;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  editableContent: HomeContent = {
    backgroundImage: '',
    banner: {
      title: '',
      subtitle: '',
      playBtn: { text: '' },
      listQsBtn: { text: '' }
    }
  };

  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    if (this.page?.content) {
      this.editableContent = {
        backgroundImage: this.page.content['backgroundImage'] || '',
        banner: {
          title: this.page.content['banner']?.title || '',
          subtitle: this.page.content['banner']?.subtitle || '',
          playBtn: { text: this.page.content['banner']?.playBtn?.text || 'play' },
          listQsBtn: { text: this.page.content['banner']?.listQsBtn?.text || 'all quizzes' }
        }
      };
    }

    // Автосохранение через 1.5 секунды
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
            backgroundImage: this.editableContent.backgroundImage,
            banner: this.editableContent.banner
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
    this.saveMessage = 'Ошибка: ' + (err.error?.message || err.message || 'Неизвестная ошибка');
    console.error('Home save error:', err);
    setTimeout(() => this.saveStatus = 'idle', 5000);
  }
}