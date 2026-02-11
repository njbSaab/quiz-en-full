import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { getPublicPath } from '../config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const bust = req.headers['x-cache-bust'] || Date.now().toString();
    res.setHeader('X-Cache-Bypass', bust);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Vary', 'Origin, X-Cache-Bust');
  }
  next();
});
app.enableCors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:4200',
      'https://votevibe.club',
      'https://www.votevibe.club',
      'https://1xarea.com',
      'https://qkr.top4winners.top',
      'https://quiz-viet.netlify.app',
      'https://localhost:4200',
      'https://localhost:3333',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, origin);
    } else {
      console.log('CORS BLOCKED:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: [
    'Content-Type',
    'secret-word',         
    'Authorization',
    'X-Cache-Bust',
    'x-secret-word',       
    'X-Secret-Word'        
  ],
  exposedHeaders: ['X-Cache-Bypass'],
  maxAge: 86400, 
});
// Статические файлы
app.useStaticAssets(join(getPublicPath(), 'images'), {
  prefix: '/images/',
});
// Swagger
  const config = new DocumentBuilder()
    .setTitle('Quiz API')
    .setDescription('API for managing quizzes and user results')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-Secret-Word', in: 'header' }, 'secret-word')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  logger.log(`Swagger paths: ${JSON.stringify(Object.keys(document.paths))}`);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Quiz API Documentation',
  });
  
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.enableShutdownHooks();
  const port = process.env.PORT ?? 4001;
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Static images available at: http://localhost:${port}/images/`);
}
bootstrap();