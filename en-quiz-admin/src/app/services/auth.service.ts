import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment'; // ← важно правильный путь

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn = false;

  constructor(private router: Router) {
    // При создании сервиса проверяем, вдруг пользователь уже залогинен в прошлой сессии
    this.isLoggedIn = sessionStorage.getItem('auth') === 'true';
  }

  // Теперь просто сверяем с environment
  login(login: string, password: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (
        login === environment.adminLogin &&
        password === environment.adminPassword
      ) {
        this.isLoggedIn = true;
        sessionStorage.setItem('auth', 'true');
        sessionStorage.setItem('isAvailable', 'true');
        sessionStorage.setItem('role', 'admin');        // или 'superadmin', как тебе нужно
        sessionStorage.setItem('login', login);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  getLogin(): string | null {
    return sessionStorage.getItem('login');
  }

  logout(): void {
    this.isLoggedIn = false;
    sessionStorage.clear();
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn || sessionStorage.getItem('auth') === 'true';
  }

  getRole(): string | null {
    return sessionStorage.getItem('role');
  }
}