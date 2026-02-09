// src/modules/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersQueryService } from './users.query.service';
import { UsersCommandService } from './users.command.service';
import { UserSessionsCommandService } from './user-sessions/user-sessions.command.service';
import { UserMapper } from './mappers/user.mapper';
import { UserSessionMapper } from './mappers/user-session.mapper'; // 🎯 Импортировали
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSessionDataDto } from './dto/user-session-data.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Users Service - оркестрация
 * 
 * Controller (GRASP):
 * - Координирует Query, Command, Sessions
 * - Применяет бизнес-правила
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly queryService: UsersQueryService,
    private readonly commandService: UsersCommandService,
    private readonly sessionsCommandService: UserSessionsCommandService,
    private readonly mapper: UserMapper,
    private readonly sessionMapper: UserSessionMapper, // 🎯 Инжектировали
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(UsersService.name);
  }

  /**
   * Получить всех пользователей
   */
  async findAll(): Promise<UserResponseDto[]> {
    this.logger.log('Finding all users');

    const models = await this.queryService.findAll();
    return this.mapper.toResponseArray(models);
  }

  /**
   * Получить пользователя по UUID
   */
  async findOne(uuid: string): Promise<UserResponseDto> {
    this.logger.log('Finding user', { uuid });

    const model = await this.queryService.findByUuid(uuid);

    if (!model) {
      throw new NotFoundException(`User with UUID ${uuid} not found`);
    }

    return this.mapper.toResponse(model);
  }

  /**
   * Создать или найти пользователя
   */
  async addUser(dto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log('Adding user', {
      uuid: dto.uuid || 'auto',
      email: dto.email,
    });

    // 1. Если UUID передан - ищем по UUID
    if (dto.uuid) {
      const existingByUuid = await this.queryService.findByUuid(dto.uuid);

      if (existingByUuid) {
        this.logger.log('Found existing user by UUID', { uuid: dto.uuid });

        // Обновляем name и email если они пришли
        if (dto.name || dto.email) {
          const updateData: any = {};
          if (dto.name) updateData.name = dto.name;
          if (dto.email) updateData.email = dto.email;

          const updated = await this.commandService.update(dto.uuid, updateData);

          // Связываем с сессией если нужно
          if (dto.sessionId) {
            await this.commandService.linkToSession(dto.uuid, dto.sessionId);
          }

          return this.mapper.toResponse(updated);
        }

        // Связываем с сессией если нужно
        if (dto.sessionId) {
          await this.commandService.linkToSession(dto.uuid, dto.sessionId);
        }

        return this.mapper.toResponse(existingByUuid);
      }
    }

    // 2. Если есть email - ищем по email
    if (dto.email) {
      const existingByEmail = await this.queryService.findByEmail(dto.email);

      if (existingByEmail) {
        this.logger.log('Found existing user by email', {
          uuid: existingByEmail.uuid,
        });

        // Обновляем имя если нужно
        if (dto.name && existingByEmail.name !== dto.name) {
          const updated = await this.commandService.update(existingByEmail.uuid, {
            name: dto.name,
          });

          // Связываем с сессией если нужно
          if (dto.sessionId) {
            await this.commandService.linkToSession(existingByEmail.uuid, dto.sessionId);
          }

          return this.mapper.toResponse(updated);
        }

        // Связываем с сессией если нужно
        if (dto.sessionId) {
          await this.commandService.linkToSession(existingByEmail.uuid, dto.sessionId);
        }

        return this.mapper.toResponse(existingByEmail);
      }
    }

    // 3. Создаем нового пользователя (только если не нашли по UUID и email)
    try {
      const model = await this.commandService.create(dto);

      // Связываем с сессией если нужно
      if (dto.sessionId) {
        await this.commandService.linkToSession(model.uuid, dto.sessionId);
      }

      this.logger.log('User created', { uuid: model.uuid });
      return this.mapper.toResponse(model);
    } catch (error: any) {
      // 🎯 ИСПРАВЛЕНИЕ: Обрабатываем ошибку дублирования UUID
      if (error.code === 'P2002' && error.meta?.target?.includes('uuid')) {
        this.logger.warn('User already exists (race condition), fetching...', {
          uuid: dto.uuid,
        });

        // Пользователь был создан между нашей проверкой и созданием (race condition)
        const existing = await this.queryService.findByUuid(dto.uuid!);
        if (existing) {
          // Обновляем email/name если нужно
          if (dto.email || dto.name) {
            const updateData: any = {};
            if (dto.name) updateData.name = dto.name;
            if (dto.email) updateData.email = dto.email;

            const updated = await this.commandService.update(dto.uuid!, updateData);
            return this.mapper.toResponse(updated);
          }

          return this.mapper.toResponse(existing);
        }
      }

      // Другая ошибка - пробрасываем дальше
      throw error;
    }
  }

  /**
   * Обновить пользователя
   */
  async updateUser(uuid: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log('Updating user', { uuid });

    // Проверяем существование
    const model = await this.queryService.findByUuid(uuid);
    if (!model) {
      throw new NotFoundException(`User with UUID ${uuid} not found`);
    }

    // Проверяем email на уникальность
    if (dto.email) {
      const existingEmail = await this.queryService.findByEmail(dto.email);
      if (existingEmail && existingEmail.uuid !== uuid) {
        throw new BadRequestException(`Email ${dto.email} already in use`);
      }
    }

    // Применяем бизнес-логику
    try {
      model.updateProfile(dto.name, dto.email);
    } catch (error) {
      this.logger.error('Validation failed', error.stack, { uuid, dto });
      throw new BadRequestException(error.message);
    }

    // Сохраняем
    const updated = await this.commandService.update(uuid, dto);

    this.logger.log('User updated', { uuid });
    return this.mapper.toResponse(updated);
  }

  /**
   * Удалить пользователя
   */
  async remove(uuid: string): Promise<{ message: string }> {
    this.logger.log('Deleting user', { uuid });

    const exists = await this.queryService.existsByUuid(uuid);
    if (!exists) {
      throw new NotFoundException(`User with UUID ${uuid} not found`);
    }

    await this.commandService.delete(uuid);

    this.logger.log('User deleted', { uuid });
    return { message: `User with UUID ${uuid} deleted successfully` };
  }

  /**
   * Сохранить сессию пользователя
   */
  async saveUserSession(sessionData: UserSessionDataDto) {
    this.logger.log('Saving user session', {
      quizId: sessionData.quizId,
      sessionId: sessionData.sessionId,
    });

    const result = await this.sessionsCommandService.saveSession(sessionData);

    this.logger.log('User session saved', {
      sessionId: result.session.sessionId,
      userId: result.userId,
    });

    return {
      session: this.sessionMapper.toResponse(result.session), // 🎯 Исправлено
      userId: result.userId,
    };
  }
}