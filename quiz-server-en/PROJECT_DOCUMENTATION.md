# 📚 Документация проекта Quiz Platform

## 🎯 Обзор проекта

**Quiz Platform** — это NestJS-приложение для создания и прохождения квизов с системой email-уведомлений и управлением пользовательскими сессиями.

### Основные возможности:
- ✅ Создание и управление квизами (вопросы + ответы)
- ✅ Прохождение квизов с сохранением прогресса
- ✅ Система результатов с подсчетом баллов
- ✅ Email-верификация и отправка результатов
- ✅ Управление контентом страниц
- ✅ Загрузка изображений
- ✅ Кэширование для оптимизации производительности
- ✅ AI-генерация квизов через Groq

---

## 🏗️ Архитектура проекта

### Применяемые паттерны

#### 1. **CQRS (Command Query Responsibility Segregation)**
Разделение операций чтения и записи:

```
📁 users/
  ├── users.service.ts           # Оркестрация
  ├── users.query.service.ts     # ТОЛЬКО SELECT
  └── users.command.service.ts   # ТОЛЬКО INSERT/UPDATE/DELETE
```

**Зачем?**
- Четкое разделение ответственности
- Легче тестировать
- Можно масштабировать чтение и запись независимо

#### 2. **GRASP принципы**

**Information Expert**
```typescript
// Модель ЗНАЕТ о своих бизнес-правилах
export class QuizModel {
  isPlayable(): boolean {
    return this.isActive && this.hasQuestions();
  }
}
```

**Creator**
```typescript
// Module создает и связывает зависимости
@Module({
  providers: [QuizzesService, QuizzesQueryService, QuizzesCommandService]
})
```

**Controller**
```typescript
// Controller ТОЛЬКО маршрутизирует, не содержит логику
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly service: QuizzesService) {}
}
```

**Pure Fabrication**
```typescript
// QueryService — искусственный класс для работы с БД
export class QuizzesQueryService {
  async findAll(): Promise<QuizModel[]> { ... }
}
```

#### 3. **Domain-Driven Design (DDD)**

```
Prisma Entity → Domain Model → Response DTO
     ↓              ↓              ↓
   (БД)       (Бизнес-логика)  (HTTP)
```

**Пример:**
```typescript
// 1. Prisma возвращает объект БД
const prismaQuiz = await prisma.quiz.findUnique({ ... });

// 2. Mapper конвертирует в Domain Model
const model = mapper.toDomain(prismaQuiz);

// 3. Model применяет бизнес-правила
model.toggleActive(); // Может выбросить ошибку

// 4. Mapper конвертирует в DTO для ответа
return mapper.toResponse(model);
```

---

## 📂 Структура модулей

### 1️⃣ **Quizzes Module** — Управление квизами

**Ответственность:**
- CRUD операции над квизами
- Получение активных квизов
- Статистика по квизам
- Переключение статуса активности

**Основные файлы:**

```typescript
// quizzes.service.ts — Оркестратор
export class QuizzesService {
  async findOne(id: number): Promise<QuizResponseDto> {
    const model = await this.queryService.findById(id);
    
    // Применяем бизнес-логику: перемешиваем ответы
    if (model.questions) {
      model.questions.forEach(q => {
        q.answers = q.shuffleAnswers(); 
      });
    }
    
    return this.mapper.toResponse(model);
  }
}
```

**Domain Model:**
```typescript
export class QuizModel {
  // Бизнес-методы
  isPlayable(): boolean {
    return this.isActive && this.hasQuestions();
  }
  
  toggleActive(): void {
    if (!this.isActive && !this.hasQuestions()) {
      throw new Error('Cannot activate quiz without questions');
    }
    this.isActive = !this.isActive;
  }
}
```

**API Endpoints:**
```
GET    /api/quizzes           - Получить все квизы
GET    /api/quizzes/active    - Получить активные квизы
GET    /api/quizzes/:id       - Получить квиз по ID
POST   /api/quizzes           - Создать квиз
PATCH  /api/quizzes/:id       - Обновить квиз
DELETE /api/quizzes/:id       - Удалить квиз
```

---

### 2️⃣ **Users Module** — Управление пользователями

**Ответственность:**
- Создание/обновление пользователей
- Управление сессиями
- Связывание анонимных пользователей с email

**Особенности:**

```typescript
// Метод addUser решает 3 задачи:
async addUser(dto: CreateUserDto) {
  // 1. Если UUID передан — ищем по UUID
  if (dto.uuid) {
    const existing = await this.queryService.findByUuid(dto.uuid);
    if (existing) return this.mapper.toResponse(existing);
  }
  
  // 2. Если есть email — ищем по email
  if (dto.email) {
    const existing = await this.queryService.findByEmail(dto.email);
    if (existing) return this.mapper.toResponse(existing);
  }
  
  // 3. Создаем нового пользователя
  const model = await this.commandService.create(dto);
  return this.mapper.toResponse(model);
}
```

**API Endpoints:**
```
GET    /api/users              - Все пользователи
GET    /api/users/:uuid        - Пользователь по UUID
POST   /api/users              - Создать пользователя
POST   /api/users/session      - Сохранить сессию
PATCH  /api/users/:uuid        - Обновить пользователя
DELETE /api/users/:uuid        - Удалить пользователя
```

---

### 3️⃣ **Quiz Results Module** — Результаты квизов

**Ответственность:**
- Сохранение результатов прохождения
- Валидация ответов
- Подсчет баллов
- Статистика

**Domain Model с бизнес-логикой:**

```typescript
export class QuizResultModel {
  // Получить процент правильных ответов
  getAccuracyPercentage(): number {
    const total = this.getTotalQuestions();
    if (total === 0) return 0;
    return Math.round((this.getCorrectAnswersCount() / total) * 100);
  }
  
  // Получить оценку (A, B, C, D, F)
  getGrade(): string {
    const percentage = this.getAccuracyPercentage();
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
  
  // Получить сообщение по результату
  getResultMessage(messages?: Record<string, string>): string {
    // Поддерживает диапазоны: "0-4", "5-7", "8"
    for (const [range, message] of Object.entries(messages)) {
      const [min, max] = range.split('-').map(Number);
      if (this.score >= min && this.score <= max) {
        return message;
      }
    }
    return this.getDefaultMessage();
  }
}
```

**API Endpoints:**
```
POST   /api/quiz-results/submit        - Отправить результаты
GET    /api/quiz-results/:id           - Результат по ID
GET    /api/quiz-results/quiz/:quizId  - Результаты квиза
GET    /api/quiz-results/user/:userId  - Результаты пользователя
```

---

### 4️⃣ **Email Module** — Email-сервисы

**Архитектура:**

```typescript
EmailService (оркестратор)
  ├── EmailSenderService        // SMTP отправка
  ├── EmailTemplateService      // HTML шаблоны
  ├── CodeVerificationService   // Генерация/верификация кодов
  └── EmailChainTriggerService  // Триггер цепочки писем
```

**Процесс верификации:**

```typescript
// 1. Генерация кода
const code = this.emailService.generateCode(); // "123456"
const encrypted = this.emailService.encryptCode(code); // "ZHNmc2Rmc2Rm..."

// 2. Отправка email
await this.emailService.sendVerificationCode(email, code, siteUrl);

// 3. Верификация
const isValid = await this.emailService.verifyCode(encrypted, userInput);
if (isValid) {
  // Отправляем результаты квиза
  await this.emailService.sendQuizResult({ ... });
}
```

**Email Templates:**
```typescript
export class EmailTemplateService {
  renderVerificationCode(code: string, siteUrl: string): string {
    // HTML с кодом в красивой верстке
  }
  
  renderQuizResult(data: { userName, score, ... }): string {
    // HTML с результатами квиза
  }
}
```

**API Endpoints:**
```
POST /api/email/send-code  - Отправить код верификации
POST /api/email/verify     - Верифицировать код и отправить результаты
```

---

### 5️⃣ **Edit Content Module** — Управление контентом

**Ответственность:**
- CRUD для страниц (slug-based)
- Публикация/снятие с публикации
- Кэширование контента

**Кэширование:**

```typescript
@Controller('pages')
@UseInterceptors(CacheInterceptor) // ✅ Кэш на 24 часа
export class EditContentController {
  @Get()           // Кэшируется
  async findAll() { ... }
  
  @Patch(':id')    // НЕ кэшируется, но инвалидирует кэш
  async update() {
    const result = await this.service.update(...);
    this.cacheInterceptor.invalidate('pages'); // Сброс кэша
    return result;
  }
}
```

**API Endpoints:**
```
GET    /api/pages              - Все страницы
GET    /api/pages/:slug        - Страница по slug
PATCH  /api/pages/:id          - Обновить страницу
PATCH  /api/pages/:id/publish  - Опубликовать
DELETE /api/pages/cache        - Очистить кэш
```

---

## 🔐 Security & Guards

### Secret Word Guard

```typescript
@Injectable()
export class SecretWordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secretWord = request.headers['x-secret-word'];
    return secretWord === process.env.SECRET_WORD;
  }
}
```

**Использование:**
```typescript
@Post()
@UseGuards(SecretWordGuard) // ✅ Защищает эндпоинт
async create(@Body() dto: CreateQuizDto) { ... }
```

---

## 🎨 Mappers — Преобразование данных

```
Prisma Entity ──→ Domain Model ──→ Response DTO
    (БД)          (Бизнес-логика)     (API)
```

**Пример:**

```typescript
@Injectable()
export class QuizMapper {
  // Prisma → Domain Model
  toDomain(prismaQuiz: any): QuizModel {
    return new QuizModel({
      id: prismaQuiz.id,
      title: prismaQuiz.title,
      questions: prismaQuiz.questions?.map(q => this.questionToDomain(q)),
      // ...
    });
  }
  
  // Domain Model → Response DTO
  toResponse(model: QuizModel): QuizResponseDto {
    return {
      id: model.id,
      title: model.title,
      questionCount: model.getQuestionCount(), // ✅ Бизнес-метод
      questions: model.questions?.map(q => ({ ... })),
    };
  }
}
```

---

## 📊 Prisma Schema (основные модели)

```prisma
model Quiz {
  id             Int      @id @default(autoincrement())
  title          String
  isActive       Boolean  @default(true)
  type           String   @default("POINTS") // POINTS | MAJORITY
  resultMessages String?  @db.Text // JSON с сообщениями
  questions      Question[]
  results        UserResult[]
}

model Question {
  id      Int      @id @default(autoincrement())
  quizId  Int
  text    String
  order   Int?
  answers Answer[]
  quiz    Quiz     @relation(fields: [quizId], references: [id])
}

model User {
  uuid     String?  @unique
  email    String?  @unique
  name     String?
  results  UserResult[]
  sessions UserSession[]
}

model UserResult {
  id        Int      @id @default(autoincrement())
  userId    String?
  quizId    Int?
  score     Int
  answers   Json     // Обогащенные ответы
  refSource String?  // Источник перехода
}
```

---

## 🚀 Как начать работу

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка .env

```env
# База данных
DATABASE_URL="mysql://user:password@localhost:3306/quiz_db"

# Email
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="noreply@votevibe.club"

# Security
SECRET_WORD="your-secret-word"
SECRET_KEY="your-encryption-key"

# AI
GROQ_SECRET_KEY="gsk_..."

# Ports
PORT=4001
```

### 3. Миграция БД

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Запуск

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 5. Swagger документация

После запуска доступна по адресу:
```
http://localhost:4001/swagger
```

---

## 🔥 Основные сценарии использования

### Сценарий 1: Пользователь проходит квиз

```typescript
// 1. Получаем квиз
GET /api/quizzes/1

// 2. Сохраняем прогресс сессии
POST /api/users/session
{
  "quizId": 1,
  "sessionId": "uuid-v4",
  "currentQuestionIndex": 2,
  "answers": [
    { "questionId": 1, "answerId": 3 }
  ]
}

// 3. Отправляем финальные результаты
POST /api/quiz-results/submit
{
  "quizId": 1,
  "userId": "user-uuid",
  "sessionId": "session-uuid",
  "score": 8,
  "answers": [ ... ]
}
```

### Сценарий 2: Email-верификация и результаты

```typescript
// 1. Запрашиваем код
POST /api/email/send-code
{
  "email_user": "user@example.com",
  "site_url": "https://votevibe.club"
}
Response: { "encrypted_code": "..." }

// 2. Пользователь вводит код
POST /api/email/verify
{
  "email_user": "user@example.com",
  "encrypted_code": "...",
  "code": "123456",
  "quiz_id": 1,
  "session_id": "uuid",
  "name_user": "John"
}
```

---

## 🎓 Лучшие практики

### ✅ DO

```typescript
// ✅ Использовать Domain Models для бизнес-логики
export class QuizModel {
  toggleActive(): void {
    if (!this.hasQuestions()) {
      throw new Error('Cannot activate without questions');
    }
    this.isActive = !this.isActive;
  }
}

// ✅ Разделять Query и Command
export class QuizzesQueryService {
  async findAll() { } // Только SELECT
}
export class QuizzesCommandService {
  async create() { }  // Только INSERT/UPDATE/DELETE
}

// ✅ Использовать Mappers
const model = this.mapper.toDomain(prismaQuiz);
return this.mapper.toResponse(model);
```

### ❌ DON'T

```typescript
// ❌ Не помещать бизнес-логику в Service напрямую
async toggleActive(id: number) {
  const quiz = await this.prisma.quiz.findUnique({ where: { id } });
  if (!quiz.questions.length) throw new Error('...');
  // Должно быть в модели!
}

// ❌ Не смешивать чтение и запись в одном сервисе
export class QuizzesService {
  async findAll() { }  // Query
  async create() { }   // Command
  // Разделить на QueryService и CommandService!
}
```

---

## 🧪 Тестирование

```typescript
describe('QuizModel', () => {
  it('should not activate quiz without questions', () => {
    const quiz = new QuizModel({ isActive: false, questions: [] });
    expect(() => quiz.toggleActive()).toThrow();
  });
  
  it('should shuffle answers', () => {
    const question = new QuestionModel({
      answers: [
        new AnswerModel({ id: 1, text: 'A' }),
        new AnswerModel({ id: 2, text: 'B' })
      ]
    });
    const shuffled = question.shuffleAnswers();
    expect(shuffled).toHaveLength(2);
  });
});
```

---

## 📝 Roadmap

### Текущие возможности
- ✅ CRUD квизов
- ✅ Email-верификация
- ✅ Результаты и статистика
- ✅ Кэширование
- ✅ AI-генерация квизов

### Планы на будущее
- 🔄 WebSocket для real-time обновлений
- 🔄 Рейтинговая система
- 🔄 Социальные функции (sharing)
- 🔄 Аналитика и метрики
- 🔄 Мультиязычность

---

## 🤝 Как добавить новую фичу

### Пример: Добавить комментарии к квизам

**1. Создать модель**
```typescript
export class CommentModel {
  id: number;
  quizId: number;
  userId: string;
  text: string;
  createdAt: Date;
  
  isValid(): boolean {
    return this.text.length >= 10;
  }
}
```

**2. Создать Query/Command сервисы**
```typescript
export class CommentsQueryService {
  async findByQuiz(quizId: number): Promise<CommentModel[]> { }
}

export class CommentsCommandService {
  async create(dto: CreateCommentDto): Promise<CommentModel> { }
}
```

**3. Создать Controller**
```typescript
@Controller('comments')
export class CommentsController {
  @Get('quiz/:quizId')
  async findByQuiz(@Param('quizId') quizId: number) {
    return this.service.findByQuiz(quizId);
  }
}
```

---

## 📞 Контакты и поддержка

- **Email:** hello@votevibe.club
- **Swagger:** http://localhost:4001/swagger
- **База знаний:** Эта документация

---

**Важно:** Всегда следуй принципам CQRS, используй Domain Models для бизнес-логики и Mappers для преобразования данных. Это сделает код чистым, тестируемым и масштабируемым! 🚀
