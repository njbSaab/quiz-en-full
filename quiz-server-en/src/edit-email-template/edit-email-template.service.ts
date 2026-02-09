import { Injectable, NotFoundException } from '@nestjs/common';
import { EditEmailTemplateQueryService } from './edit-email-template.query.service';
import { EditEmailTemplateCommandService } from './edit-email-template.command.service';
import { EmailTemplateMapper } from './mappers/email-template.mapper';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplateResponseDto } from './dto/email-template.response.dto';
@Injectable()
export class EditEmailTemplateService {
  constructor(
    private readonly queryService: EditEmailTemplateQueryService,
    private readonly commandService: EditEmailTemplateCommandService,
    private readonly mapper: EmailTemplateMapper,
  ) {}
  async findById(id: number): Promise<EmailTemplateResponseDto> {
    const model = await this.queryService.findById(id);
    if (!model) throw new NotFoundException('Email template not found');
    return this.mapper.toResponse(model);
  }
  async findByQuiz(quizId: number): Promise<EmailTemplateResponseDto[]> {
    const models = await this.queryService.findByQuiz(quizId);
    return this.mapper.toResponseArray(models);
  }
  async create(dto: CreateEmailTemplateDto): Promise<EmailTemplateResponseDto> {
    const created = await this.commandService.create(dto);
    return this.mapper.toResponse(created);
  }
  async update(id: number, dto: UpdateEmailTemplateDto): Promise<EmailTemplateResponseDto> {
    const updated = await this.commandService.update(id, dto);
    return this.mapper.toResponse(updated);
  }
  async delete(id: number): Promise<void> {
    await this.commandService.delete(id);
  }
}