// src/modules/quiz-results/dto/submit-quiz.dto.ts

import { IsNumber, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO для ответа на вопрос
 */
class AnswerDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  questionId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  answerId: number;
}

/**
 * DTO для отправки результатов квиза
 */
export class SubmitQuizDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  quizId: number;

  @ApiProperty({ example: 'user-uuid-123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'session-uuid-123' })
  @IsString()
  sessionId: string;

  @ApiProperty({ example: 85 })
  @IsNumber()
  score: number; // 🎯 Добавили

  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({ example: 'vn' })
  @IsOptional()
  @IsString()
  geo?: string | null;

  @ApiPropertyOptional({ example: 'utm_source=google' })
  @IsOptional()
  @IsString()
  ref_source?: string | null; // 🎯 Оставляем snake_case для API
}