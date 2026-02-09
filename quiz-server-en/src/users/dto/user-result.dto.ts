// src/users/dto/user-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsOptional, IsString, IsBoolean } from 'class-validator';

export class AnswerDto {
  @ApiProperty({ description: 'ID вопроса', example: 3 })
  @IsNumber()
  questionId: number;

  @ApiProperty({ description: 'ID выбранного ответа', example: 12 })
  @IsNumber()
  answerId: number;

  @ApiProperty({ description: 'Текст вопроса', example: 'Which team is shown in the picture?' })
  @IsString()
  questionText: string;

  @ApiProperty({ description: 'Текст ответа', example: 'juventus' })
  @IsString()
  answerText: string;

  @ApiProperty({ description: 'Является ли ответ правильным', example: false })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ description: 'Очки за ответ', example: 0 })
  @IsNumber()
  points: number;
}

export class UserResultDto {
  @ApiProperty({ description: 'ID квиза', example: 1 })
  @IsNumber()
  quizId: number;

  @ApiProperty({
    description: 'ID пользователя (UUID)',
    required: false,
    example: '8335e78b-d22b-4317-b44f-307fed589750',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Уникальный ID сессии', required: false, example: '0f0734f5-5005-44ce-8d56-b370c4f7f3c9' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'Баллы пользователя', example: 0 })
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Ответы пользователя', type: [AnswerDto] })
  @IsArray()
  answers: AnswerDto[];
}