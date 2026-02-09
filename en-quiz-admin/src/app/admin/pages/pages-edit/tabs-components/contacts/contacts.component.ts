// src/app/admin/pages/pages-edit/tabs-components/contacts/contacts.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface Socials {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}

interface ContactForm {
  title: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitButton: string;
}

interface ContactsContent {
  title: string;
  address: string;
  workingHours: string;
  email: string;
  socialsTitle: string;
  socials: Socials;
  form: ContactForm;
}

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss'
})
export class ContactsComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  editableContent: ContactsContent = {
    title: '',
    address: 'VoteVibe',
    workingHours: '週一至週五, 10:00–18:00 (GMT+7)',
    email: 'hello@votevibe.club',
    socialsTitle: '社群媒體...',
    socials: {},
    form: {
      title: '留言給我們',
      nameLabel: '姓名（必填）',
      namePlaceholder: 'John Doe',
      emailLabel: '電子郵件（必填）',
      emailPlaceholder: 'johndoe@example.com',
      messageLabel: '留言（必填）',
      messagePlaceholder: '請在此輸入您的訊息...',
      submitButton: '傳送'
    }
  };

  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    if (this.page?.content?.['contacts']) {
      const contacts = this.page.content['contacts'];
      this.editableContent = {
        title: contacts.title || 'We are always ready to listen...',
        address: contacts.address || 'VoteVibe',
        workingHours: contacts.workingHours || 'Monday–Friday, 10:00–18:00 (GMT+7)',
        email: contacts.email || 'hello@votevibe.club',
        socialsTitle: contacts.socialsTitle || 'Social media...',
        socials: contacts.socials || {},
        form: {
          title: contacts.form?.title || 'Leave us a message',
          nameLabel: contacts.form?.nameLabel || 'Name (required)',
          namePlaceholder: contacts.form?.namePlaceholder || 'John Doe',
          emailLabel: contacts.form?.emailLabel || 'Email (required)',
          emailPlaceholder: contacts.form?.emailPlaceholder || 'johndoe@example.com',
          messageLabel: contacts.form?.messageLabel || 'Message (required)',
          messagePlaceholder: contacts.form?.messagePlaceholder || 'Type your message here...',
          submitButton: contacts.form?.submitButton || 'Send'
        }
      };
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
            contacts: this.editableContent
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
    console.error('Contacts save error:', err);
    setTimeout(() => this.saveStatus = 'idle', 5000);
  }
  get hasAnySocial(): boolean {
    return !!(
      this.editableContent.socials.twitter ||
      this.editableContent.socials.linkedin ||
      this.editableContent.socials.facebook ||
      this.editableContent.socials.instagram
    );
  }
}