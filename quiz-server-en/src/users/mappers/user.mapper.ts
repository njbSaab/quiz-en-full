// src/modules/users/mappers/user.mapper.ts

import { Injectable } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { UserResponseDto } from '../dto/user-response.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

/**
 * User Mapper - преобразование между слоями
 */
@Injectable()
export class UserMapper {
  /**
   * Prisma → Domain Model
   */
  // src/modules/users/mappers/user.mapper.ts

toDomain(prismaUser: any): UserModel {
  const totalScore = this.calculateTotalScore(prismaUser.results || []);

  return new UserModel({
    id: prismaUser.id,
    uuid: prismaUser.uuid,
    name: prismaUser.name,
    email: prismaUser.email,
    geo: prismaUser.geo,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
    browserInfo: prismaUser.sessions?.[0]?.browserInfo || null,
    results: prismaUser.results || [],
    sessions: prismaUser.sessions || [],
    completedQuizzesCount: prismaUser._count?.results ?? prismaUser.results?.length ?? 0,
    sessionsCount: prismaUser._count?.sessions ?? prismaUser.sessions?.length ?? 0,
    score: totalScore,
    totalPoints: totalScore,  // если totalPoints = score, то так
  });
}

toResponse(model: UserModel): UserResponseDto {
  // Защищённые даты — никогда не упадём на toISOString()
  const safeDate = (date: Date | string | undefined | null): string => {
    if (!date) return new Date().toISOString();           // fallback на сейчас
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') return new Date(date).toISOString();
    return new Date().toISOString();                      // любой другой случай
  };

  return {
    id: model.id?.toString() ?? '0',
    uuid: model.uuid ?? '',
    name: model.name,
    email: model.email,
    displayName: model.getDisplayName(),
    isRegistered: model.isRegistered(),
    isAnonymous: model.isAnonymous(),
    geo: model.geo,
    
    createdAt: safeDate(model.createdAt),
    updatedAt: safeDate(model.updatedAt),

    browserInfo: model.browserInfo || null,
    completedQuizzesCount: model.completedQuizzesCount ?? model.getCompletedQuizzesCount() ?? 0,
    sessionsCount: model.sessionsCount ?? model.getSessionsCount() ?? 0,

    score: model.score ?? 0,
    totalPoints: model.totalPoints ?? 0,

    results: model.results?.map((result: any) => ({
      id: result.id,
      quizId: result.quizId,
      score: result.score ?? 0,
      answers: result.answers || [],
      createdAt: safeDate(result.createdAt),
      quizTitle: result.quiz?.titleAdm || result.quiz?.title || `Quiz #${result.quizId}`,
    })) ?? [],
  } as UserResponseDto;
}

  toResponseArray(models: UserModel[]): UserResponseDto[] {
    return models.map(model => this.toResponse(model));
  }

  /**
   * CreateDTO → Prisma Create Input
   */
  toPrismaCreate(dto: CreateUserDto) {
    return {
      uuid: dto.uuid,
      name: dto.name ?? null,
      email: dto.email ?? null,
      geo: dto.geo ?? null,
      emailSequenceState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * UpdateDTO → Prisma Update Input
   */
  toPrismaUpdate(dto: UpdateUserDto) {
    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.geo !== undefined) data.geo = dto.geo;

    data.updatedAt = new Date();

    return data;
  }

  /**
   * Подсчитать общий счет
   */
  private calculateTotalScore(results: any[]): number {
    if (!results || results.length === 0) return 0;
    return results.reduce((sum, result) => sum + (result.score || 0), 0);
  }
}