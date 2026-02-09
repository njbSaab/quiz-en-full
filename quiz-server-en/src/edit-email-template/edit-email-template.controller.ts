import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EditEmailTemplateService } from './edit-email-template.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplateResponseDto } from './dto/email-template.response.dto';
import { SecretWordGuard } from 'src/utils/guards/secret-word.guard';

@Controller('email-templates')
export class EditEmailTemplateController {
  constructor(private readonly service: EditEmailTemplateService) {}
  @Get('quiz/:quizId')
  async getByQuiz(@Param('quizId') quizId: string): Promise<EmailTemplateResponseDto[]> {
    return this.service.findByQuiz(+quizId);
  }
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<EmailTemplateResponseDto> {
    return this.service.findById(+id);
  }
  @Post()
  @UseGuards(SecretWordGuard)
  async create(@Body() dto: CreateEmailTemplateDto): Promise<EmailTemplateResponseDto> {
    return this.service.create(dto);
  }
  @Patch(':id')
  @UseGuards(SecretWordGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplateResponseDto> {
    return this.service.update(+id, dto);
  }
  @Delete(':id')
  @UseGuards(SecretWordGuard)
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(+id);
  }
}