import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserCountService } from '../../../services/user-count.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  filteredCount$!: Observable<number>;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private userCountService: UserCountService
  ) {
  }
  ngOnInit(): void {
    this.filteredCount$ = this.userCountService.filteredCount$;
  }

  logout(): void {
    this.authService.logout();
  }
  refreshCount(): void {
    this.userCountService.refresh();
  }

}