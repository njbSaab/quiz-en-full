import { Controller, Get, Delete, Param, HttpException, HttpStatus } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { getPublicPath } from '../../../config';

@Controller('images')
export class ImagesController {
  @Get()
  async getImages(): Promise<string[]> {
    const imagesFolder = path.join(getPublicPath(), 'images');
    try {
      const files = await fs.readdir(imagesFolder);
      return files.map(file => `/images/${file}`);
    } catch (error) {
      console.error('Ошибка чтения папки с изображениями', error);
      return [];
    }
  }

  @Delete(':filename')
  async deleteImage(@Param('filename') filename: string): Promise<void> {
    const imagesFolder = path.join(getPublicPath(), 'images');
    const filePath = path.join(imagesFolder, filename);

    // Проверяем, что путь находится внутри папки images (защита от path traversal)
    if (!filePath.startsWith(imagesFolder)) {
      throw new HttpException('Недопустимое имя файла', HttpStatus.BAD_REQUEST);
    }

    // Проверяем, что файл является изображением
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    if (!validExtensions.includes(ext)) {
      throw new HttpException('Файл не является изображением', HttpStatus.BAD_REQUEST);
    }

    try {
      // Проверяем существование файла
      await fs.access(filePath);
      // Удаляем файл
      await fs.unlink(filePath);
      console.log(`Изображение ${filename} успешно удалено`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new HttpException('Файл не найден', HttpStatus.NOT_FOUND);
      }
      console.error('Ошибка удаления изображения', error);
      throw new HttpException('Ошибка удаления файла', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}