// src/app/admin/pages/pages-edit/pages-edit.component.ts

import { Component, OnInit } from '@angular/core';
import { Page } from '../../../interfaces/pages.interface';
import { PagesService } from '../../../services/pages.service';

const LAST_SELECTED_PAGE_KEY = 'lastSelectedAdminPageSlug';

@Component({
  selector: 'app-pages-edit',
  templateUrl: './pages-edit.component.html',
  styleUrl: './pages-edit.component.scss'
})
export class PagesEditComponent implements OnInit {
  pages: Page[] = [];
  activeSlug: string | null = null;
  activePage: Page | null = null;
  isLoading = false;

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    this.loadAllPages();
  }

  /**
   * ✅ ОБНОВЛЕНО: Используем админский метод БЕЗ кэша
   */
  loadAllPages(): void {
    this.isLoading = true;

    // ✅ getAllPagesAdmin() вместо getAllPages()
    this.pagesService.getAllPagesAdmin().subscribe({
      next: (pages) => {
        // ✅ В админке показываем ВСЕ страницы (включая неактивные)
        this.pages = pages;

        if (this.pages.length === 0) {
          this.isLoading = false;
          return;
        }

        // 1. Сначала пытаемся восстановить последний выбранный таб
        const lastSlug = localStorage.getItem(LAST_SELECTED_PAGE_KEY);

        if (lastSlug && this.pages.some(p => p.slug === lastSlug)) {
          this.selectPage(lastSlug);
        } else {
          // 2. Если нет сохранённого или он недоступен — выбираем первый
          this.selectPage(this.pages[0].slug);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load pages:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ ОБНОВЛЕНО: Используем админский метод БЕЗ кэша
   */
  selectPage(slug: string): void {
    if (this.activeSlug === slug) return;

    this.activeSlug = slug;
    this.activePage = null;

    // Сохраняем в localStorage выбранный таб
    localStorage.setItem(LAST_SELECTED_PAGE_KEY, slug);

    // ✅ getPageBySlugAdmin() вместо getPage()
    this.pagesService.getPageBySlugAdmin(slug).subscribe({
      next: (page) => {
        this.activePage = page; // Всегда свежие данные
      },
      error: (err) => {
        console.error('Failed to load page:', err);
      }
    });
  }

  /**
   * Сохранить страницу
   */
  onSave(updatedPage: Page): void {
    if (!updatedPage || !updatedPage.id) {
      console.error('Cannot save: page or page.id is missing');
      return;
    }

    console.log('Сохраняем страницу:', updatedPage);

    this.pagesService.updatePage(updatedPage.id, {
      title: updatedPage.title,
      content: updatedPage.content
    }).subscribe({
      next: () => {
        console.log('✅ Page saved and cache cleared');
        // Перезагружаем страницу чтобы показать актуальные данные
        if (this.activeSlug) {
          this.selectPage(this.activeSlug);
        }
      },
      error: (err) => {
        console.error('❌ Failed to save page:', err);
      }
    });
  }

  /**
   * Отменить изменения
   */
  onCancel(): void {
    if (this.activeSlug) {
      // Перезагружаем страницу из БД
      this.selectPage(this.activeSlug);
    }
  }

  /**
   * ✅ НОВОЕ: Переключить публикацию
   */
  togglePublish(page: Page): void {
    const action = page.isActive 
      ? this.pagesService.unpublishPage(page.id)
      : this.pagesService.publishPage(page.id);

    action.subscribe({
      next: () => {
        console.log('✅ Page publication toggled');
        this.loadAllPages(); // Перезагружаем список
      },
      error: (err) => {
        console.error('❌ Toggle failed:', err);
      }
    });
  }
}