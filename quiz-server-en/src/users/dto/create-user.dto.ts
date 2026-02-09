import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Имя пользователя', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Электронная почта пользователя', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID пользователя', required: false })
  @IsOptional()
  @IsString()
  uuid?: string;

  @ApiProperty({ example: 'session-1234567890', description: 'ID сессии для связи', required: false })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  geo?: string;
}