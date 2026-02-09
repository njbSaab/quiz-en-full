// email-template.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../interfaces/api-response';
import { EmailTemplate, EmailTemplateContent } from '../interfaces/email-template';

@Injectable({
  providedIn: 'root'
})
export class ChaineEmailsTemplateService {
  private apiUrl = environment.apiUrl + '/email-templates';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Secret-Word': environment.secretWord,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Получить шаблоны по ID квиза
   */
  getByQuiz(quizId: number): Observable<EmailTemplate[]> {
    return this.http.get<ApiResponse<EmailTemplate[]>>(`${this.apiUrl}/quiz/${quizId}`)
      .pipe(
        map(response => {
          if (response && 'data' in response) {
            return response.data;
          }
          return response as unknown as EmailTemplate[];
        })
      );
  }

  /**
   * Получить один шаблон по ID
   */
  getById(id: number): Observable<EmailTemplate> {
    return this.http.get<ApiResponse<EmailTemplate>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response && 'data' in response) {
            return response.data;
          }
          return response as unknown as EmailTemplate;
        })
      );
  }

  /**
   * Создать новый шаблон
   */
  create(template: Partial<EmailTemplate>): Observable<EmailTemplate> {
    return this.http.post<ApiResponse<EmailTemplate>>(this.apiUrl, template, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response as unknown as EmailTemplate;
      })
    );
  }

  /**
   * Обновить шаблон
   */
  update(id: number, template: Partial<EmailTemplate>): Observable<EmailTemplate> {
    return this.http.patch<ApiResponse<EmailTemplate>>(`${this.apiUrl}/${id}`, template, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return response as unknown as EmailTemplate;
      })
    );
  }

  /**
   * Удалить шаблон
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Парсинг bodyText (JSON строка → объект)
   */
  parseBodyText(bodyText: string | null | undefined): EmailTemplateContent {
    if (!bodyText?.trim()) {
      return this.getDefaultContent();
    }

    try {
      return JSON.parse(bodyText);
    } catch (e) {
      console.warn('Failed to parse bodyText:', e);
      return this.getDefaultContent();
    }
  }

  /**
   * Сериализация content → JSON строка
   */
  stringifyContent(content: EmailTemplateContent): string {
    return JSON.stringify(content, null, 2);
  }

  /**
   * Дефолтный контент для нового шаблона
   */
  getDefaultContent(): EmailTemplateContent {
    return {
      titleText: 'It looks like you forgot something important…',
      highlightText: "We still remember your meme vibe — it's truly legendary",
      prizeText: 'But your reward seems to have been left behind for some reason',
      descriptionText: 'You aced the quiz «What Type of Meme Are You?» and proved you know how to catch trends with sarcasm and joy\nSo why not keep the vibe going?',
      callToAction: "We're sure the reward from our partners will suit you perfectly — claim it before it waits for you forever!",
      btnLink: 'https://1betgo.xyz/pmzC4m?to=6'
    };
  }

  /**
   * Создать дефолтный шаблон для квиза
   */
  getDefaultTemplate(quizId: number): Partial<EmailTemplate> {
    return {
      app: 'quiz',
      geo: 'vn',
      sequenceId: 1,
      step: 1,
      quizId: quizId,
      subject: 'Hello, {{name}}! It looks like you forgot something important...',
      html: '<h1>Follow-up Email</h1>',
      delayHours: 24,
      bodyText: this.stringifyContent(this.getDefaultContent())
    };
  }

  /**
 * Создаёт дефолтную цепочку follow-up писем для нового квиза
 * @param quizId — ID только что созданного квиза
 * @param quizTitle — название квиза (для subject и текста)
 */
// ChaineEmailsTemplateService

async createDefaultChain(quizId: number, quizTitle: string = 'Quiz'): Promise<void> {
  const defaultChain = [
    // Письмо 1 — через 1 час
    {
      sequenceId: 1,
      step: 1,
      delayHours: 1,
      subject: `🎉 ${quizTitle} — твои результаты уже готовы!`,
      bodyText: JSON.stringify({
        titleText: "Ты круто прошёл квиз!",
        highlightText: `Твой результат в «${quizTitle}» — просто огонь! 🔥`,
        prizeText: "Твой подарок ждёт тебя 🏆🎁",
        descriptionText: "Ты проявил отличные знания, юмор и скорость. Поздравляем!",
        callToAction: "Забери приз прямо сейчас — он не будет ждать вечно!",
        btnLink: "https://1betgo.xyz/pmzC4m?to=6"
      })
    },
    // Письмо 2 — через 24 часа
    {
      sequenceId: 1,
      step: 2,
      delayHours: 24,
      subject: `{{name}}, твой приз всё ещё ждёт! ⏳`,
      bodyText: JSON.stringify({
        titleText: "Не забудь забрать свою награду!",
        highlightText: "Мы видим, что ты прошёл квиз, но ещё не забрал приз...",
        prizeText: "Это твой заслуженный подарок 🎁",
        descriptionText: "Такие предложения долго не живут — действуй!",
        callToAction: "Забрать приз →",
        btnLink: "https://1betgo.xyz/pmzC4m?to=6"
      })
    },
    // Письмо 3 — через 72 часа
    {
      sequenceId: 1,
      step: 3,
      delayHours: 72,
      subject: `Последний шанс забрать приз от «${quizTitle}»!`,
      bodyText: JSON.stringify({
        titleText: "Это действительно последний шанс...",
        highlightText: "Твой приз скоро уйдёт другому счастливчику",
        prizeText: "🏆 Не упусти!",
        descriptionText: "Ты был очень близко — осталось только кликнуть!",
        callToAction: "Забрать сейчас!",
        btnLink: "https://1betgo.xyz/pmzC4m?to=6"
      })
    }
  ];

  const promises = defaultChain.map(tpl =>
    this.create({
      app: 'quiz',
      geo: 'vn',
      sequenceId: tpl.sequenceId,
      step: tpl.step,
      quizId: quizId,
      subject: tpl.subject,
      html: '<div>Content from bodyText</div>',
      delayHours: tpl.delayHours,
      bodyText: tpl.bodyText
    })
  );

  await Promise.all(promises);
  console.log(`Создана дефолтная цепочка из ${defaultChain.length} писем для quiz #${quizId}`);
}
}