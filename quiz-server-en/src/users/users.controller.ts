// src/modules/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSessionDataDto } from './dto/user-session-data.dto';
import { SecretWordGuard } from '../utils/guards/secret-word.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Users Controller
 * 
 * Controller (GRASP):
 * - Только маршрутизация HTTP
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users - Получить всех пользователей
   */
  @Get()
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить список всех пользователей' })
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * GET /users/:uuid - Получить пользователя
   */
  @Get(':uuid')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Получить пользователя по UUID' })
  async findOne(@Param('uuid') uuid: string) {
    return this.usersService.findOne(uuid);
  }

  /**
   * POST /users - Создать пользователя
   */
  @Post()
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Создать нового пользователя' })
  @HttpCode(HttpStatus.CREATED)
  async addUser(@Body() dto: CreateUserDto) {
    return this.usersService.addUser(dto);
  }

  /**
   * POST /users/session - Сохранить сессию
   */
  @Post('session')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Сохранить данные сессии пользователя' })
  @HttpCode(HttpStatus.CREATED)
  async saveUserSession(@Body() sessionData: UserSessionDataDto) {
    return this.usersService.saveUserSession(sessionData);
  }

  /**
   * PATCH /users/:uuid - Обновить пользователя
   */
  @Patch(':uuid')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Обновить данные пользователя' })
  async updateUser(@Param('uuid') uuid: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(uuid, dto);
  }

  /**
   * DELETE /users/:uuid - Удалить пользователя
   */
  @Delete(':uuid')
  @UseGuards(SecretWordGuard)
  @ApiOperation({ summary: 'Удалить пользователя' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('uuid') uuid: string) {
    return this.usersService.remove(uuid);
  }
}