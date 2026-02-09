// users-page.component.ts
import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../../services/users.service';
import { User } from '../../../interfaces/users.interface';
import { QuizService } from '../../../services/quiz.service';
import { Quiz } from '../../../interfaces/quiz.interface';
import { UserCountService } from '../../../services/user-count.service';
import { AnswerEnrichmentService } from '../../../services/answer-enrichment.service';

@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  isLoading = true;
  isLoadingDetails = false;
  error: string | null = null;
  isDetailsVisible = false;
  quizzes: Quiz[] = [];
  
  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private quiz: QuizService,
    private userCountService: UserCountService,
    private answerEnrichment: AnswerEnrichmentService  // ✅ Добавили сервис
  ) {}

  ngOnInit(): void {
    this.loadQuiz();
    this.loadUsers();
  }

  /**
   * ✅ ВАЖНО: Сначала загружаем квизы
   */
  loadQuiz(): void {
    this.quiz.getQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        console.log('✅ Quizzes loaded:', this.quizzes.length);
      },
      error: (err) => {
        console.error('❌ Error loading quizzes:', err);
      }
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Users loaded from backend:', users);
        
        this.users = users;
        this.isLoading = false;
        
        localStorage.setItem('userCount', users.length.toString());
        
        const filteredCount = users.filter(user => 
          user.browserInfo !== null && user.browserInfo !== undefined
        ).length;
        
        localStorage.setItem('filteredUserCount', filteredCount.toString());
        this.userCountService.setFilteredCount(filteredCount);
        
        console.log('📊 Users stats:', {
          total: this.users.length,
          withBrowserInfo: filteredCount,
        });
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = 'Failed to load users: ' + (error.message || JSON.stringify(error));
        this.isLoading = false;
        console.error('❌ Error loading users:', error);
        this.cdr.markForCheck();
      },
    });
  }

  deleteUser(uuid: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(uuid).subscribe({
        next: () => {
          this.users = this.users.filter((user) => user.uuid !== uuid);
          this.selectedUser = null;
          console.log(`User with UUID ${uuid} deleted`);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.error = 'Failed to delete user';
          console.error('Error deleting user:', error);
          this.cdr.markForCheck();
        },
      });
    }
  }

  /**
   * ✅ ОБНОВЛЕНО: Обогащаем answers после загрузки
   */
  toggleDetailsUser(uuid: string): void {
    console.log('🔍 Toggle details for UUID:', uuid);
    
    if (this.selectedUser?.uuid === uuid) {
      this.selectedUser = null;
      this.isDetailsVisible = false;
      this.cdr.markForCheck();
      return;
    }

    this.selectedUser = null;
    this.isDetailsVisible = false;
    this.isLoadingDetails = true;
    this.cdr.markForCheck();

    this.userService.getUserById(uuid).subscribe({
      
      next: (fullUser) => {
        console.log('✅ Full user data loaded:', fullUser);
        // ✅ ОБОГАЩАЕМ ANSWERS
        if (fullUser.results && fullUser.results.length > 0) {
          console.log('🔧 Enriching answers...');
          
          fullUser.results = fullUser.results.map(result => {
            const quizId = result.quizId ?? 0;
            const enrichedAnswers = this.answerEnrichment.enrichAnswers(
              
              result.answers,
              quizId,
              this.quizzes
            );
            
            console.log(`📋 Result #${result.id}:`, {
              quizId: result.quizId,
              originalAnswers: result.answers,
              enrichedAnswers: enrichedAnswers
            });
            
            return {
              ...result,
              answers: enrichedAnswers
            };
          });
        }
        
        this.selectedUser = fullUser;
        
        const index = this.users.findIndex(u => u.uuid === uuid);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], results: fullUser.results };
        }
        
        this.isDetailsVisible = true;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error loading user details:', err);
        this.error = 'Не удалось загрузить детали пользователя';
        this.isLoadingDetails = false;
        this.cdr.markForCheck();
      }

    });
  }

  getQuizTitle(quizId: number | null | undefined): string {
    if (!quizId) return 'Неизвестный квиз';
    
    const quiz = this.quizzes.find(q => q.id === quizId);
    
    if (!quiz) return `Квиз #${quizId}`;
    
    return quiz.titleAdm || quiz.title || `Квиз #${quizId}`;
  }

  getResultsCount(user: User): number {
    return user.completedQuizzesCount ?? user.results?.length ?? 0;
  }

  getUserScore(user: User): number {
    return user.score ?? user.totalPoints ?? 0;
  }

  hasBrowserInfo(user: User): boolean {
    return user.browserInfo !== null && user.browserInfo !== undefined;
  }

  getLanguage(user: User): string {
    return user.browserInfo?.language || '-';
  }

  getPlatform(user: User): string {
    return user.browserInfo?.platform || '-';
  }

  getScreenResolution(user: User): string {
    if (!user.browserInfo?.screen) return '-';
    return `${user.browserInfo.screen.width}x${user.browserInfo.screen.height}`;
  }

  getTimezoneAndIP(user: User): string {
    const timezone = user.browserInfo?.timezone || '-';
    const ip = user.browserInfo?.ipAddress || '-';
    return `${timezone} / ${ip}`;
  }
}