import { Component, OnInit } from '@angular/core';
import { PagesService } from '../../../core/services/pages.service';
import { ScrollTopService } from '../../../core/services/scroll-top.service';
import { Page } from '../../../core/interfaces/pages.interface';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss'
})
export class ContactsComponent implements OnInit {
  page: Page | null = null;
  banner: Page | null = null;
  quizCount = 0;

  constructor(
    private pagesService: PagesService,
    private scrollTop: ScrollTopService
  ) {}

  ngOnInit(): void {
    this.scrollTop.toTop();

    const stored = localStorage.getItem('quizCount');
    this.quizCount = stored ? Number(stored) : 0;

    this.pagesService.getContacts().subscribe(page => {
      this.page = page;
    });
    
    this.pagesService.getHome().subscribe(page => {
      this.banner = page;
    });
    
  }

  get data() {
    return this.page?.content?.['contacts'];
  }

  get form() {
    return this.data?.form || {};
  }

  get socials() {
    return this.data?.socials || {};
  }
}