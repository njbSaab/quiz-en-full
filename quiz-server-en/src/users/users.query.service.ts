// src/modules/users/users.query.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserMapper } from './mappers/user.mapper';
import { UserModel } from './models/user.model';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class UsersQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(UsersQueryService.name);
  }

  /**
   * GET /users - Список пользователей (БЕЗ results)
   */
  async findAll(): Promise<UserModel[]> {
    const users = await this.prisma.user.findMany({
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { browserInfo: true },
        },
        _count: { select: { results: true, sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => this.mapper.toDomain(user));
  }

  /**
   * GET /users/:uuid - Полные данные пользователя (С results)
   * 
   * ✅ ВАЖНО: answers уже enriched в БД (см. saveUserSession)
   * ✅ НЕ НУЖНО обогащать повторно
   */
  async findByUuid(uuid: string): Promise<UserModel | null> {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      include: {
        results: {
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                titleAdm: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { browserInfo: true },
        },
        _count: { select: { results: true, sessions: true } },
      },
    });

    if (!user) return null;

    // ✅ answers уже enriched в БД, просто возвращаем
    return this.mapper.toDomain({
      ...user,
      browserInfo: user.sessions?.[0]?.browserInfo || null,
      results: user.results,  // ← Уже содержат questionText, answerText, isCorrect, points
      completedQuizzesCount: user._count.results,
      sessionsCount: user._count.sessions,
    });
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    this.logger.log('Finding user by email', { email });

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { browserInfo: true },
        },
        _count: {
          select: { results: true, sessions: true },
        },
      },
    });

    if (!user) return null;

    return this.mapper.toDomain({
      ...user,
      browserInfo: user.sessions[0]?.browserInfo || null,
      completedQuizzesCount: user._count.results,
      sessionsCount: user._count.sessions,
      results: [],
      sessions: [],
    });
  }

  async existsByUuid(uuid: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { uuid } });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }
}