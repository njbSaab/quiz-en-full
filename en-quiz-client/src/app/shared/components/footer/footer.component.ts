// footer.component.ts
import { Component, OnInit } from '@angular/core';
import { PagesService } from '../../../core/services/pages.service';
import { MenuItem } from '../../../core/interfaces/menu-item.interface';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  menuItems: MenuItem[] = [];
  currentYear = new Date().getFullYear();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    this.loadMenuItems();
  }

  /**
   * ✅ Загрузка пунктов меню из API
   */
  loadMenuItems(): void {
    this.pagesService.getPage('menu-items').subscribe({
      next: (page) => {
        if (page?.content?.['items']) {
          this.menuItems = (page.content['items'] as MenuItem[])
            .filter(item => item.isVisible)
            .sort((a, b) => a.order - b.order);
        } else {
          this.menuItems = this.getDefaultMenuItems();
        }
      },
      error: (err) => {
        console.error('Failed to load menu items:', err);
        this.menuItems = this.getDefaultMenuItems();
      }
    });
  }

  /**
   * Дефолтное меню
   */
  private getDefaultMenuItems(): MenuItem[] {
    return [
      { id: 'home', label: 'Quizzes...', route: '/', order: 1, isVisible: true },
      { id: 'terms', label: 'Terms of Service...', route: '/terms', order: 2, isVisible: true },
      { id: 'about', label: 'About...', route: '/about', order: 3, isVisible: true },
      { id: 'contacts', label: 'Contacts...', route: '/contacts', order: 4, isVisible: true },
      { id: 'faq', label: 'FAQ...', route: '/faq', order: 5, isVisible: true },
      { id: 'policy', label: 'Privacy Policy...', route: '/policy', order: 6, isVisible: true }
    ];
  }
}