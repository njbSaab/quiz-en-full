// src/modules/users/users.command.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserMapper } from './mappers/user.mapper';
import { UserModel } from './models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoggerService } from '../common/logger/logger.service';
import { randomUUID } from 'crypto';

/**
 * Users Command Service - ТОЛЬКО запись
 */
@Injectable()
export class UsersCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(UsersCommandService.name);
  }

   /**
   * Создать пользователя
   */
  async create(dto: CreateUserDto): Promise<UserModel> {
    this.logger.log('Creating user', {
      uuid: dto.uuid || 'auto',
      email: dto.email,
    });

    const uuid = dto.uuid || randomUUID();

    const user = await this.prisma.user.create({
      data: {
        uuid,
        name: dto.name || null,
        email: dto.email || null,
        geo: dto.geo || null,
      },
      include: {
        sessions: true,
        results: true,
      },
    });

    this.logger.log('User created', { uuid: user.uuid });

    // 🎯 Возвращаем UserModel
    return new UserModel({
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      geo: user.geo,
      createdAt: user.createdAt,
      sessions: user.sessions,
      results: user.results,
    });
  }

  /**
   * Обновить пользователя
   */
  async update(uuid: string, dto: UpdateUserDto): Promise<UserModel> {
    this.logger.log('Updating user', { uuid });

    const updated = await this.prisma.user.update({
      where: { uuid },
      data: {
        name: dto.name,
        email: dto.email,
        geo: dto.geo,
      },
      include: {
        sessions: true,
        results: true,
      },
    });

    this.logger.log('User updated', { uuid });

    // 🎯 Возвращаем UserModel
    return new UserModel({
      id: updated.id,
      uuid: updated.uuid,
      name: updated.name,
      email: updated.email,
      geo: updated.geo,
      createdAt: updated.createdAt,
      sessions: updated.sessions,
      results: updated.results,
    });
  }

  /**
   * Удалить пользователя
   */
  async delete(uuid: string): Promise<void> {
    this.logger.log('Deleting user', { uuid });

    await this.prisma.user.delete({
      where: { uuid },
    });

    this.logger.log('User deleted', { uuid });
  }

  /**
   * Связать пользователя с сессией
   */
  async linkToSession(uuid: string, sessionId: string): Promise<void> {
    this.logger.log('Linking user to session', { uuid, sessionId });

    // Обновляем сессию
    const sessionsUpdated = await this.prisma.userSession.updateMany({
      where: { sessionId },
      data: { userId: uuid },
    });

    // Обновляем результаты
    const resultsUpdated = await this.prisma.userResult.updateMany({
      where: { sessionId },
      data: { userId: uuid },
    });

    this.logger.log('User linked to session', {
      uuid,
      sessionId,
      sessionsUpdated: sessionsUpdated.count,
      resultsUpdated: resultsUpdated.count,
    });
  }

}