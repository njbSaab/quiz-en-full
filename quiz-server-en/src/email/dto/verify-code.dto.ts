// src/modules/email/dto/verify-code.dto.ts

import { IsEmail, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для верификации кода и отправки результатов
 */
export class VerifyCodeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email_user: string;

  @ApiProperty({ example: 'encrypted_code_here' })
  @IsString()
  encrypted_code: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'session-abc123' })
  @IsString()
  session_id: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  quiz_id?: number;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name_user?: string;

  @ApiProperty({ example: 'utm_source=google&utm_medium=cpc', required: false })
  @IsOptional()
  @IsString()
  ref_source?: string;
}