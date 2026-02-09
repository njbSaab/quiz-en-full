import { PrismaService } from "src/prisma.service";
import { EmailTemplateMapper } from "./mappers/email-template.mapper";
import { EmailTemplateModel } from "./models/email-template.model";
import { CreateEmailTemplateDto } from "./dto/create-email-template.dto";
import { UpdateEmailTemplateDto } from "./dto/update-email-template.dto";
import { Injectable } from '@nestjs/common';
@Injectable()
export class EditEmailTemplateCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EmailTemplateMapper
  ) {}
  async create(dto: CreateEmailTemplateDto): Promise<EmailTemplateModel> {
    const data = this.mapper.toPrismaCreate(dto);
    const record = await this.prisma.emailTemplate.create({ data });
    return this.mapper.toDomain(record);
  }
  async update(id: number, dto: UpdateEmailTemplateDto): Promise<EmailTemplateModel> {
    const record = await this.prisma.emailTemplate.update({
      where: { id },
      data: this.mapper.toPrismaUpdate(dto)
    });
    return this.mapper.toDomain(record);
  }
  async delete(id: number): Promise<void> {
    await this.prisma.emailTemplate.delete({ where: { id } });
  }
}