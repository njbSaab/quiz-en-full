import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // адаптируйте путь
import { EmailTemplateMapper } from './mappers/email-template.mapper';
import { EmailTemplateModel } from './models/email-template.model';
@Injectable()
export class EditEmailTemplateQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EmailTemplateMapper,
  ) {}
  async findById(id: number): Promise<EmailTemplateModel | null> {
    const record = await this.prisma.emailTemplate.findUnique({ where: { id } });
    return record ? this.mapper.toDomain(record) : null;
  }
  async findByQuiz(quizId: number): Promise<EmailTemplateModel[]> {
    const records = await this.prisma.emailTemplate.findMany({
      where: { quizId },
      orderBy: [{ sequenceId: 'asc' }, { step: 'asc' }],
    });
    return records.map((r) => this.mapper.toDomain(r));
  }
  async findGlobal(app: string, geo: string): Promise<EmailTemplateModel[]> {
    const records = await this.prisma.emailTemplate.findMany({
      where: { app, geo },
      orderBy: [{ sequenceId: 'asc' }, { step: 'asc' }],
    });
    return records.map((r) => this.mapper.toDomain(r));
  }
}