// src/modules/edit-content/edit-content.query.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EditContentMapper } from './mappers/edit-content.mapper';
import { EditContentModel } from './models/edit-content.model';

/**
 * Query Service - ТОЛЬКО чтение из БД
 * 
 * Pure Fabrication (GRASP):
 * - Искусственный класс для работы с данными
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО SELECT запросы
 * - НЕ изменяет данные
 */
@Injectable()
export class EditContentQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EditContentMapper,
  ) {}

  /**
   * Найти весь контент (только активный)
   */
  async findAll(): Promise<EditContentModel[]> {
    const pages = await this.prisma.page.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    return pages.map(page => this.mapper.toDomain(page));
  }

  /**
   * Найти контент по slug (только активный)
   */
  async findBySlug(slug: string): Promise<EditContentModel | null> {
    const page = await this.prisma.page.findUnique({
      where: { slug, isActive: true },
    });

    return page ? this.mapper.toDomain(page) : null;
  }

  /**
   * ✅ НОВОЕ: Найти контент по slug для админки (включая неактивный)
   * 
   * Используется в админке
   * НЕ проверяет isActive - админ должен видеть все страницы
   */
  async findBySlugIncludingInactive(slug: string): Promise<EditContentModel | null> {
    const page = await this.prisma.page.findUnique({
      where: { slug }, // ✅ Без фильтра isActive
    });

    return page ? this.mapper.toDomain(page) : null;
  }

  /**
   * Найти контент по ID (для редактирования)
   * Включая неактивные страницы
   */
  async findById(id: number): Promise<EditContentModel | null> {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    return page ? this.mapper.toDomain(page) : null;
  }

  /**
   * Проверить существование по slug
   */
  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.page.count({
      where: { slug },
    });

    return count > 0;
  }
}