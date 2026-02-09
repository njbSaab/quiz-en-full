// src/modules/email/dto/send-code.dto.ts

import { IsEmail, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для отправки кода верификации
 */
export class SendCodeDto {
  @ApiProperty({ example: 'https://votevibe.club' })
  @IsUrl()
  site_url: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email_user: string;
}