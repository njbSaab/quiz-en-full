// src/app/admin/pages/pages-edit/tabs-components/form/form.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Page } from '../../../../../interfaces/pages.interface';
import { PagesService } from '../../../../../services/pages.service';
import { Subject, debounceTime, switchMap, takeUntil, catchError, of } from 'rxjs';

interface FormTexts {
  title: string;
  subtitle: string;
  namePlaceholder: string;
  nameError: string;
  emailPlaceholder: string;
  emailError: string;
  codePlaceholder: string;
  codeError: string;
  codeSuccess: string;
  resendLink: string;
  buttonContinue: string;
  buttonSubmit: string;
  closeButton: string;
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent implements OnInit, OnDestroy {
  @Input() page!: Page;

  editableContent: FormTexts = {
    title: 'We will send the results via email.',
    subtitle: 'Please enter your information:',
    namePlaceholder: 'Name',
    nameError: 'This field is required.',
    emailPlaceholder: 'Email',
    emailError: 'Please enter a valid email address.',
    codePlaceholder: 'Code',
    codeError: 'Please enter the verification code.',
    codeSuccess: 'Verification code sent, please enter it here.',
    resendLink: 'Resend?',
    buttonContinue: 'Continue',
    buttonSubmit: 'Submit',
    closeButton: 'Close'
  };
  
  saving = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveMessage = '';

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private pagesService: PagesService) {}

  ngOnInit(): void {
    if (this.page?.content?.['result']) {
      const form = this.page.content['result'];
        this.editableContent = {
        title: form.title || 'We will send the results via email.',
        subtitle: form.subtitle || 'Please enter your information:',
        namePlaceholder: form.namePlaceholder || 'Name',
        nameError: form.nameError || 'This field is required.',
        emailPlaceholder: form.emailPlaceholder || 'Email',
        emailError: form.emailError || 'Please enter a valid email address.',
        codePlaceholder: form.codePlaceholder || 'Code',
        codeError: form.codeError || 'Please enter the verification code.',
        codeSuccess: form.codeSuccess || 'Verification code sent, please enter it below.',
        resendLink: form.resendLink || 'Resend?',
        buttonContinue: form.buttonContinue || 'Continue',
        buttonSubmit: form.buttonSubmit || 'Submit',
        closeButton: form.closeButton || 'Close'
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
            form: this.editableContent
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
    console.error('Form save error:', err);
    setTimeout(() => this.saveStatus = 'idle', 5000);
  }
}