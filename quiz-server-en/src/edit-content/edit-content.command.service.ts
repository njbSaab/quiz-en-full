// src/modules/edit-content/edit-content.command.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EditContentMapper } from './mappers/edit-content.mapper';
import { EditContentModel } from './models/edit-content.model';
import { UpdateContentDto } from './dto/update-content.dto';

/**
 * Command Service - ТОЛЬКО запись в БД
 * 
 * Pure Fabrication (GRASP):
 * - Искусственный класс для изменения данных
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО UPDATE/INSERT/DELETE
 * - НЕ читает данные
 */
@Injectable()
export class EditContentCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EditContentMapper,
  ) {}

  /**
   * Обновить контент
   */
  async update(id: number, dto: UpdateContentDto): Promise<EditContentModel> {
    const updateData: any = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }

    if (dto.content !== undefined) {
      updateData.content = this.mapper.stringifyContent(dto.content);
    }

    // Автоматически обновляем updatedAt
    updateData.updatedAt = new Date();

    const updated = await this.prisma.page.update({
      where: { id },
      data: updateData,
    });

    return this.mapper.toDomain(updated);
  }

  /**
   * Сохранить модель целиком
   * Используется когда бизнес-логика изменила модель
   */
  async save(model: EditContentModel): Promise<EditContentModel> {
    const updated = await this.prisma.page.update({
      where: { id: model.id },
      data: {
        title: model.title,
        content: this.mapper.stringifyContent(model.content),
        isActive: model.isActive,
        updatedAt: model.updatedAt,
      },
    });

    return this.mapper.toDomain(updated);
  }

  /**
   * Опубликовать контент
   */
  async publish(id: number): Promise<EditContentModel> {
    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(updated);
  }

  /**
   * Снять с публикации
   */
  async unpublish(id: number): Promise<EditContentModel> {
    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(updated);
  }
}