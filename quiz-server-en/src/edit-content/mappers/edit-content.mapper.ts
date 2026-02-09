// src/modules/edit-content/mappers/edit-content.mapper.ts

import { Injectable } from '@nestjs/common';
import { EditContentModel } from '../models/edit-content.model';
import { ContentResponseDto } from '../dto/content-response.dto';

/**
 * Mapper для преобразования данных между слоями
 * 
 * Information Expert (GRASP):
 * - Знает как конвертировать Prisma → Model → DTO
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО маппинг данных
 */
@Injectable()
export class EditContentMapper {
  /**
   * Из Prisma объекта в Domain Model
   */
  toDomain(prismaPage: any): EditContentModel {
    return new EditContentModel({
      id: prismaPage.id,
      slug: prismaPage.slug,
      title: prismaPage.title,
      content: this.parseContent(prismaPage.content),
      isActive: prismaPage.isActive,
      createdAt: prismaPage.createdAt,
      updatedAt: prismaPage.updatedAt,
    });
  }

  /**
   * Из Domain Model в Response DTO
   */
  toResponse(model: EditContentModel): ContentResponseDto {
    return new ContentResponseDto({
      id: model.id,
      slug: model.slug,
      title: model.title,
      content: model.content,
      isActive: model.isActive,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    });
  }

  /**
   * Массив моделей в массив DTO
   */
  toResponseArray(models: EditContentModel[]): ContentResponseDto[] {
    return models.map(model => this.toResponse(model));
  }

  /**
   * Парсинг JSON content из БД
   * Information Expert: маппер знает формат данных
   */
  parseContent(content: any): Record<string, any> {
    if (!content) {
      return {};
    }

    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse content:', e);
        return {};
      }
    }

    return content;
  }

  /**
   * Сериализация content для БД
   */
  stringifyContent(content: Record<string, any>): string {
    return JSON.stringify(content);
  }
}