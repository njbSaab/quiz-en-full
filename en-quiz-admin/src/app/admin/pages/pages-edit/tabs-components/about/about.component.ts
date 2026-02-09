// src/app/admin/pages/pages-edit/tabs-components/about/about.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface AboutTab {
  id: string;
  label: string;
  title: string;
  body: string;
  color: 'cayn' | 'fuchsia' | 'center';
}

interface AboutContent {
  title: string;
  subtitle: string;
  tabs: AboutTab[];
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  editableContent: AboutContent = {
    title: '',
    subtitle: '',
    tabs: []
  };

  activeTabId: string = ''; // ID активного таба

  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    if (this.page?.content?.['about']) {
      const about = this.page.content['about'];
      this.editableContent = {
        title: about.title || 'about...',
        subtitle: about.subtitle || '',
        tabs: (about.tabs || []).map((tab: any) => ({
          id: tab.id || this.generateId(),
          label: tab.label || 'Новый таб',
          title: tab.title || 'Заголовок',
          body: tab.body || '',
          color: tab.color || 'cayn'
        }))
      };

      // Открываем первый таб, если есть
      if (this.editableContent.tabs.length > 0) {
        this.activeTabId = this.editableContent.tabs[0].id;
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
            about: this.editableContent
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
    console.error('About save error:', err);
    setTimeout(() => this.saveStatus = 'idle', 5000);
  }

  setActiveTab(id: string) {
    this.activeTabId = id;
  }

  addTab() {
    const newTab: AboutTab = {
      id: this.generateId(),
      label: 'Новый раздел',
      title: 'Заголовок раздела',
      body: '<p>Текст раздела...</p>',
      color: 'cayn'
    };
    this.editableContent.tabs.push(newTab);
    this.activeTabId = newTab.id;
    this.onFieldChange();
  }

  removeTab(id: string) {
    const index = this.editableContent.tabs.findIndex(t => t.id === id);
    if (index !== -1 && confirm('Удалить этот раздел?')) {
      this.editableContent.tabs.splice(index, 1);
      if (this.activeTabId === id) {
        this.activeTabId = this.editableContent.tabs[0]?.id || '';
      }
      this.onFieldChange();
    }
  }

  get activeTabIndex(): number {
    return this.editableContent.tabs.findIndex(t => t.id === this.activeTabId);
  }
  
  get activeTabNumber(): number {
    if (this.editableContent.tabs.length === 0) return 0;
    const index = this.editableContent.tabs.findIndex(t => t.id === this.activeTabId);
    return index >= 0 ? index + 1 : 1;
  }

  private generateId(): string {
    return 'tab_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getActiveTab(): AboutTab | null {
    return this.editableContent.tabs.find(t => t.id === this.activeTabId) || null;
  }
}