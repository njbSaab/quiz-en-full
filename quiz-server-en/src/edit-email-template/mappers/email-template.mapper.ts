import { Injectable } from '@nestjs/common';
import { Prisma, EmailTemplate as PrismaEmailTemplate } from '@prisma/client';
import { EmailTemplateModel } from '../models/email-template.model';
import { EmailTemplateResponseDto } from '../dto/email-template.response.dto';
import { CreateEmailTemplateDto } from '../dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from '../dto/update-email-template.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTemplateMapper {
  constructor(private configService: ConfigService) {} 
  toDomain(prismaTemplate: PrismaEmailTemplate): EmailTemplateModel {
    
    return new EmailTemplateModel({
      id: prismaTemplate.id,
      app: prismaTemplate.app,
      geo: prismaTemplate.geo,
      sequenceId: prismaTemplate.sequenceId,
      step: prismaTemplate.step,
      quizId: prismaTemplate.quizId,
      subject: prismaTemplate.subject,
      html: prismaTemplate.html,
      delayHours: prismaTemplate.delayHours,
      bodyText: prismaTemplate.bodyText,
    });
  }
  toPrismaCreate(dto: CreateEmailTemplateDto) {
    const GEO = this.configService.get<string>('GEO') || 'vn'; 
    return {
      app: dto.app ?? `quiz${dto.quizId ?? 'quizUnknow'}`,
      geo: dto.geo ?? GEO,
      sequenceId: dto.sequenceId,
      step: dto.step,
      quizId: dto.quizId ?? null,         
      subject: dto.subject,
      html: dto.html,
      delayHours: dto.delayHours,
      bodyText: dto.bodyText ?? null,
    };
  }
  toPrismaUpdate(dto: UpdateEmailTemplateDto) {
    const data: Record<string, any> = {};  // ← any вместо Prisma.UpdateInput
    if (dto.app !== undefined) data.app = dto.app ?? null;
    if (dto.geo !== undefined) data.geo = dto.geo ?? null;
    if (dto.sequenceId !== undefined) data.sequenceId = dto.sequenceId;
    if (dto.step !== undefined) data.step = dto.step;
    if (dto.quizId !== undefined) data.quizId = dto.quizId ?? null;  // ← Prisma примет
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.html !== undefined) data.html = dto.html;
    if (dto.delayHours !== undefined) data.delayHours = dto.delayHours;
    if (dto.bodyText !== undefined) data.bodyText = dto.bodyText ?? null;
    return data;
  }
  toResponse(model: EmailTemplateModel): EmailTemplateResponseDto {
    return new EmailTemplateResponseDto({
      id: model.id,
      app: model.app,
      geo: model.geo,
      sequenceId: model.sequenceId,
      step: model.step,
      quizId: model.quizId,
      subject: model.subject,
      html: model.html,
      delayHours: model.delayHours,
      bodyText: model.bodyText,
      // createdAt: model.createdAt?.toISOString(),
      // updatedAt: model.updatedAt?.toISOString(),
    });
  }
  toResponseArray(models: EmailTemplateModel[]): EmailTemplateResponseDto[] {
    return models.map((model) => this.toResponse(model));
  }
}