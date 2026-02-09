import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizAiGeneratComponent } from './quiz-ai-generat.component';

describe('QuizAiGeneratComponent', () => {
  let component: QuizAiGeneratComponent;
  let fixture: ComponentFixture<QuizAiGeneratComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuizAiGeneratComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizAiGeneratComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
