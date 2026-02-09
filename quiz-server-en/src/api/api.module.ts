import { Module } from '@nestjs/common';
import { ImagesController } from './controllers/images.controller';
import { UploadController } from './controllers/upload.controller';
import { LocalUploadService } from './services/local-upload.service';
import { QuizAIGeneratorController } from './controllers/quiz-ai-generator.controller';
import { QuizAIGeneratorService } from './services/quiz-ai-generator.service';

@Module({
      controllers: [ImagesController, UploadController, QuizAIGeneratorController],
      providers: [LocalUploadService, QuizAIGeneratorService],
      
})
export class ApiModule {}
