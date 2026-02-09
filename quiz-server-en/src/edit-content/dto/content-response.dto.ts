// src/modules/edit-content/dto/content-response.dto.ts

/**
 * DTO для ответа клиенту
 * Single Responsibility: только структура ответа
 */
export class ContentResponseDto {
  id: number;
  slug: string;
  title: string;
  content: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(data: Partial<ContentResponseDto>) {
    Object.assign(this, data);
  }
}