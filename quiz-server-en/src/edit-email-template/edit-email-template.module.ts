import { Module } from '@nestjs/common';
import { EditEmailTemplateService } from './edit-email-template.service';
import { EditEmailTemplateController } from './edit-email-template.controller';
import { EditEmailTemplateQueryService } from './edit-email-template.query.service';
import { EditEmailTemplateCommandService } from './edit-email-template.command.service';
import { EmailTemplateMapper } from './mappers/email-template.mapper';
import { PrismaService } from '../prisma.service'; // адаптируйте путь

@Module({
  controllers: [EditEmailTemplateController],
  providers: [
    EditEmailTemplateService,
    EditEmailTemplateQueryService,
    EditEmailTemplateCommandService,
    EmailTemplateMapper,
    PrismaService,
  ],
  exports: [EditEmailTemplateService],
})
export class EditEmailTemplateModule {}