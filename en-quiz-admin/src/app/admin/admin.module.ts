import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditPageComponent } from './pages/admin-page/edit-page/edit-page.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { SharedModule } from '../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditIcoComponent } from './components/ui/icons/edit-ico/edit-ico.component';
import { CancelIcoComponent } from './components/ui/icons/cancel-ico/cancel-ico.component';
import { DoneIcoComponent } from './components/ui/icons/done-ico/done-ico.component';
import { SendMessagePageComponent } from './pages/send-message-page/send-message-page.component';
import { AddedImagePageComponent } from './pages/added-image-page/added-image-page.component';
import { AddedPageComponent } from './pages/added-page/added-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { QuizAllPageComponent } from './pages/quiz-all-page/quiz-all-page.component';
import { QuizSinglePageComponent } from './pages/quiz-all-page/quiz-single-page/quiz-single-page.component';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { ImageUploadComponent } from './pages/added-image-page/image-upload/image-upload.component';
import { ImageTableComponent } from './pages/added-image-page/image-table/image-table.component';
import { QuizAiGeneratComponent } from './pages/quiz-ai-generat/quiz-ai-generat.component';
import { QuizFormComponent } from './components/view/quiz-form/quiz-form.component';
import { MailTemplateComponent } from './components/view/quiz-form/mail-template/mail-template.component';
import { PagesEditComponent } from './pages/pages-edit/pages-edit.component';
import { TermsComponent } from './pages/pages-edit/tabs-components/terms/terms.component';
import { FaqComponent } from './pages/pages-edit/tabs-components/faq/faq.component';
import { FormComponent } from './pages/pages-edit/tabs-components/form/form.component';
import { ThanksComponent } from './pages/pages-edit/tabs-components/thanks/thanks.component';
import { PolicyComponent } from './pages/pages-edit/tabs-components/policy/policy.component';
import { AboutComponent } from './pages/pages-edit/tabs-components/about/about.component';
import { HomeComponent } from './pages/pages-edit/tabs-components/home/home.component';
import { ContactsComponent } from './pages/pages-edit/tabs-components/contacts/contacts.component';
import { ChainEmailsTemplateComponent } from './components/view/quiz-form/chain-emails-template/chain-emails-template.component';
import { MenuItemsComponent } from './pages/pages-edit/tabs-components/menu-items/menu-items.component';

@NgModule({
  declarations: [
    EditPageComponent,
    AdminPageComponent,
    EditIcoComponent,
    CancelIcoComponent,
    DoneIcoComponent,
    SendMessagePageComponent,
    AddedImagePageComponent,
    AddedPageComponent,
    ProfilePageComponent,
    QuizAllPageComponent,
    QuizSinglePageComponent,
    UsersPageComponent,
    AddedImagePageComponent,
    ImageUploadComponent,
    ImageTableComponent,
    QuizAiGeneratComponent,
    QuizFormComponent,
    MailTemplateComponent,
    PagesEditComponent,
    TermsComponent,
    FaqComponent,
    FormComponent,
    ThanksComponent,
    PolicyComponent,
    AboutComponent,
    HomeComponent,
    ContactsComponent,
    ChainEmailsTemplateComponent,
    MenuItemsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule,  
  ],
  exports: [
    EditPageComponent,
  ],

})
export class AdminModule { }