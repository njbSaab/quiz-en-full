import { IsString, IsOptional, IsArray, ValidateNested, IsInt, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AnswerDto {
  @ApiProperty({ example: 'Answer text', description: 'Текст ответа' })
  @IsString()
  text: string;

  @ApiProperty({ example: true, description: 'Является ли ответ правильным' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ example: 1, description: 'Очки за правильный ответ' })
  @IsInt()
  points: number;
}

class QuestionDto {
  @ApiProperty({ example: 'What is 2+2?', description: 'Текст вопроса' })
  @IsString()
  text: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL изображения для вопроса', required: false })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: 1, description: 'Порядок вопроса в квизе', required: false })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ type: [AnswerDto], description: 'Список ответов для вопроса', required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers?: AnswerDto[];
}

export class UpdateQuizDto {
  // === СТАРЫЕ ПОЛЯ ===
  @ApiProperty({ example: 'Math Quiz Updated', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'New first page', required: false })
  @IsString()
  @IsOptional()
  firstPage?: string;

  @ApiProperty({ example: 'New final page', required: false })
  @IsString()
  @IsOptional()
  finalPage?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'https://new-preview.jpg', required: false })
  @IsString()
  @IsOptional()
  previewImage?: string;

  @ApiProperty({ example: 2, required: false })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ example: 4.8, required: false })
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiProperty({ example: { '0-4': 'Updated...' }, required: false })
  @IsObject()
  @IsOptional()
  resultMessages?: Record<string, string>;

  @ApiProperty({ type: [QuestionDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];

  // === НОВЫЕ ПОЛЯ ===
  @ApiProperty({ example: 'Math Quiz (Admin Updated)', required: false })
  @IsString()
  @IsOptional()
  titleAdm?: string;

  @ApiProperty({ example: 'Обновлённое описание для админов', required: false })
  @IsString()
  @IsOptional()
  descriptionAdm?: string;

  @ApiProperty({ example: 'Коротко: математика', required: false })
  @IsString()
  @IsOptional()
  descrip?: string;

  @ApiProperty({ example: 'Математика 101', required: false })
  @IsString()
  @IsOptional()
  quizShortTitle?: string;

  @ApiProperty({
    description: 'Дополнительная информация о квизе (объект)',
    example: {
      duration: '10 мин',
      questions: 15,
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  quizInfo?: Record<string, any>;

  @ApiProperty({ example: true, description: 'Показывать на главной', required: false })
  @IsBoolean()
  @IsOptional()
  isMainView?: boolean;

  @ApiProperty({ 
  example: 'POINTS', 
  enum: ['POINTS', 'PERSONALITY', 'TRUE_FALSE'], 
  description: 'Тип квиза' 
  })
  @IsOptional()
  @IsString()
  type?: string = 'POINTS';
}