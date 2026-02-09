import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators'; // ← очень важный импорт!
import { Subscription } from 'rxjs';

import { LayoutService } from './core/services/layout.service';
import { UserIdentityService } from './core/services/user-identity.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'quiz-app-ang';
  showHeaderFooter = true;
  isRouting = true; // показываем лоадер при старте приложения

  private subscription = new Subscription();

  constructor(
    private layoutService: LayoutService,
    private identityService: UserIdentityService,
    private router: Router
  ) {
    // Подписка на видимость header/footer
    this.subscription.add(
      this.layoutService.showHeaderFooter$.subscribe(visible => {
        this.showHeaderFooter = visible;
      })
    );

    // Отслеживание навигации
    this.subscription.add(
      this.router.events.pipe(
        filter((e): e is NavigationStart | NavigationEnd | NavigationCancel | NavigationError =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError
        )
      ).subscribe(event => {
        if (event instanceof NavigationStart) {
          this.isRouting = true;
        } else {
          // End, Cancel, Error → завершение навигации
          this.isRouting = false;
        }
      })
    );
  }

  async ngOnInit(): Promise<void> {
    await this.identityService.initialize();
    // Опционально: защитный таймер, если приложение очень долго грузится
    // setTimeout(() => (this.isRouting = false), 5000);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleTheme(event: Event): void {
    const input = event.target as HTMLInputElement;
    const theme = input.checked ? 'acid' : 'dracula';
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Можно оставить, но в большинстве случаев NavigationEnd достаточно
  onRouteActivate(): void {
    this.isRouting = false;
  }
}