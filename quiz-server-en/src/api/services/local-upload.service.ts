import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class LocalUploadService {
  private readonly logger = new Logger(LocalUploadService.name);

  async uploadFile(localPath: string, targetPath: string): Promise<void> {
    try {
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.rename(localPath, targetPath);
      this.logger.log(`Файл успешно перемещен в ${targetPath}`);
    } catch (error) {
      this.logger.error('Ошибка при перемещении файла', error);
      throw error;
    }
  }
}