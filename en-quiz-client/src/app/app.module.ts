import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { QuizListModule } from './view/quiz-list/quiz-list.module';
import { SharedModule } from './shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { QuizSingleModule } from './view/quiz-single/quiz-single.module';
import { QuizPlayModule } from './view/quiz-play/quiz-play.module';
import { CommonModule } from '@angular/common';
import { QuizResultModule } from './view/quiz-result/quiz-result.module';
import { AboutModule } from './view/about/about.module';
import { ContactsModule } from './view/contacts/contacts.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CorsBypassInterceptor } from './core/interceptors/cors-bypass.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';  
import { BgUrlPipe } from './core/pipes/bg-url.pipe';
import {environment} from '../environments/environment.prod'
@NgModule({
  declarations: [
    AppComponent,
    BgUrlPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    QuizListModule,
    SharedModule,
    HttpClientModule,
    QuizSingleModule,
    QuizPlayModule,
    AboutModule,
    ContactsModule,
    CommonModule,
    QuizResultModule,
    BrowserAnimationsModule,
    // ServiceWorkerModule.register('/quen/ngsw-worker.js', {
    //   enabled: environment.production,
    //   scope: '/quen/',                   
    //   registrationStrategy: 'registerImmediately' 
    // })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: CorsBypassInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }