import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface MenuItem {
  id: string;
  label: string;
  route: string;
  order: number;
  isVisible: boolean;
}

@Component({
  selector: 'app-menu-items',
  templateUrl: './menu-items.component.html',
  styleUrls: ['./menu-items.component.scss']
})
export class MenuItemsComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  editableItems: MenuItem[] = [];
  originalItems: MenuItem[] = []; // для отслеживания изменений

  previewLogo = 'https://i.ibb.co/Qvd3RYXX/5.png';
  previewBrand = 'VoteVibe';

  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';
  hasChanges = false;

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    this.loadAndPrepareItems();

    // Настройка автосохранения
    this.saveSubject.pipe(
      debounceTime(1500),
      switchMap(() => {
        if (!this.hasChanges) return of(null);
        return this.saveChanges();
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

private loadAndPrepareItems() {
  let items: MenuItem[] = [];

  // Безопасный доступ через ['items']
  if (this.page?.content && 'items' in this.page.content) {
    const rawItems = this.page.content['items'];

    if (Array.isArray(rawItems)) {
      items = [...(rawItems as MenuItem[])];
    }
  }

  console.log(items)

  // Если items не пришли или пустой массив → fallback
  if (items.length === 0) {
    items = [
      { id: 'home',    label: 'Quizzes',          route: '/main',    order: 1, isVisible: true },
      { id: 'terms',   label: 'Terms of Service', route: '/terms',   order: 2, isVisible: true },
      { id: 'about',   label: 'About',            route: '/about',   order: 3, isVisible: true },
      { id: 'contacts',label: 'Contacts',         route: '/contacts',order: 4, isVisible: true },
      { id: 'faq',     label: 'FAQ',              route: '/faq',     order: 5, isVisible: true },
      { id: 'policy',  label: 'Privacy Policy',   route: '/policy',  order: 6, isVisible: true }
    ];
  }

  // Глубокая копия + сортировка (на всякий случай)
  this.editableItems = items
    .map(item => ({ ...item })) // глубокая копия каждого объекта
    .sort((a, b) => a.order - b.order);

  // Сохраняем оригинал для сравнения изменений
  this.originalItems = this.editableItems.map(item => ({ ...item }));

  this.checkHasChanges();
}

  onFieldChange() {
    this.checkHasChanges();
    this.saveSubject.next();
  }

  private checkHasChanges() {
    if (this.editableItems.length !== this.originalItems.length) {
      this.hasChanges = true;
      return;
    }

    this.hasChanges = this.editableItems.some((item, index) => {
      const orig = this.originalItems[index];
      return !orig ||
        item.label !== orig.label ||
        item.route !== orig.route ||
        item.isVisible !== orig.isVisible ||
        item.order !== orig.order;
    });
  }

  addNewItem() {
    const newOrder = this.editableItems.length > 0
      ? Math.max(...this.editableItems.map(i => i.order)) + 1
      : 1;

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      label: 'Новый пункт',
      route: '/new-page',
      order: newOrder,
      isVisible: true
    };

    this.editableItems.push(newItem);
    this.checkHasChanges();
    this.saveSubject.next();
  }

  removeItem(index: number) {
    if (confirm('Удалить пункт меню?')) {
      this.editableItems.splice(index, 1);
      // Пересчитываем order
      this.editableItems.forEach((item, i) => item.order = i + 1);
      this.checkHasChanges();
      this.saveSubject.next();
    }
  }

  moveUp(index: number) {
    if (index <= 0) return;
    const temp = this.editableItems[index];
    this.editableItems[index] = this.editableItems[index - 1];
    this.editableItems[index - 1] = temp;

    // Обновляем order
    this.editableItems.forEach((item, i) => item.order = i + 1);

    this.checkHasChanges();
    this.saveSubject.next();
  }

  moveDown(index: number) {
    if (index >= this.editableItems.length - 1) return;
    const temp = this.editableItems[index];
    this.editableItems[index] = this.editableItems[index + 1];
    this.editableItems[index + 1] = temp;

    this.editableItems.forEach((item, i) => item.order = i + 1);

    this.checkHasChanges();
    this.saveSubject.next();
  }

  private saveChanges() {
    this.saving = true;
    this.saveStatus = 'saving';
    this.saveMessage = 'Сохранение...';

    const patchData = {
      title: this.page.title,
      content: {
        ...this.page.content,
        items: [...this.editableItems]
      }
    };

    return this.pagesService.updatePage(this.page.id, patchData).pipe(
      catchError(err => {
        this.saving = false;
        this.saveStatus = 'error';
        this.saveMessage = 'Ошибка сохранения';
        console.error('Menu save error:', err);
        return of(null);
      })
    );
  }

  saveManually() {
    this.saveSubject.next();
  }

  // Для удобства в шаблоне — видимые элементы
  get visibleItemsCount(): number {
    return this.editableItems.filter(i => i.isVisible).length;
  }
}