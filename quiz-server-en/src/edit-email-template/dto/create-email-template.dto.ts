import { IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateEmailTemplateDto {
  @IsOptional()
  @IsString()
  app?: string;

  @IsOptional()
  @IsString()
  geo?: string;

  @IsInt()
  @Min(1)
  sequenceId: number;

  @IsInt()
  @Min(1)
  step: number;

  @IsOptional()
  @IsInt()
  quizId?: number;

  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;

  @IsInt()
  @Min(0)
  delayHours: number;

  @IsOptional()
  @IsString()
  bodyText?: string;
}