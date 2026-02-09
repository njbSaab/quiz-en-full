// src/modules/edit-content/dto/update-content.dto.ts

import { IsString, IsOptional, IsObject, MinLength } from 'class-validator';

/**
 * DTO для обновления контента
 * Single Responsibility: только валидация входящих данных
 */
export class UpdateContentDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  title?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}