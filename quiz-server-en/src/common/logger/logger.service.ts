// src/common/logger/logger.service.ts
import { Injectable, Scope } from '@nestjs/common';
import { LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: Logger;
  private context?: string;

  constructor() {
    this.logger = new Logger();
  }

  setContext(context: string) {
    this.context = context;
    this.logger = new Logger(context);
  }

  private getColoredLevel(level: string): string {
    switch (level.toLowerCase()) {
      case 'error':
        return chalk.red.bold('ERROR');
      case 'warn':
        return chalk.yellow.bold('WARN ');
      case 'debug':
        return chalk.cyan('DEBUG');
      case 'verbose':
        return chalk.gray('VERBOSE');
      case 'log':
      case 'info':
      default:
        return chalk.green('INFO ');
    }
  }

  private getColoredContext(): string {
    return this.context ? chalk.blue(`[${this.context}]`) : '';
  }

  private getColoredTimestamp(): string {
    return chalk.gray(new Date().toISOString());
  }

  // 🎯 Форматирование handler
  private getColoredHandler(controller?: string, handler?: string): string {
    if (!controller && !handler) return '';
    
    if (controller && handler) {
      return chalk.magenta(`${controller}.${handler}()`);
    }
    
    return controller ? chalk.magenta(controller) : '';
  }

  private formatWithMeta(message: string, meta?: Record<string, any>): string {
    if (!meta || Object.keys(meta).length === 0) {
      return message;
    }

    // Извлекаем controller и handler для специального форматирования
    const { controller, handler, ...restMeta } = meta;
    
    let formattedMessage = message;
    
    // Добавляем информацию о handler если есть
    if (controller || handler) {
      const handlerInfo = this.getColoredHandler(controller, handler);
      formattedMessage = `${message} ${handlerInfo}`;
    }

    // Форматируем остальные метаданные
    if (Object.keys(restMeta).length > 0) {
      const metaString = Object.entries(restMeta)
        .map(([key, value]) => {
          // Специальное форматирование для разных типов
          if (key === 'method') {
            return chalk.bold.white(value);
          }
          if (key === 'url') {
            return chalk.cyan(value);
          }
          if (key === 'duration') {
            const durationValue = typeof value === 'string' 
              ? parseInt(value) 
              : value;
            const color = durationValue > 1000 
              ? chalk.red 
              : durationValue > 500 
                ? chalk.yellow 
                : chalk.green;
            return `${chalk.dim('⏱')} ${color(value)}`;
          }
          if (key === 'statusCode') {
            const code = typeof value === 'string' 
              ? parseInt(value) 
              : value;
            const color = code >= 500 
              ? chalk.red 
              : code >= 400 
                ? chalk.yellow 
                : chalk.green;
            return color(value);
          }
          
          if (typeof value === 'object' && value !== null) {
            return `${chalk.dim(key)}=${JSON.stringify(value)}`;
          }
          return `${chalk.dim(key)}=${value}`;
        })
        .join(' ');

      formattedMessage = `${formattedMessage} ${chalk.dim('→')} ${metaString}`;
    }

    return formattedMessage;
  }

  log(message: string, meta?: Record<string, any>) {
    const timestamp = this.getColoredTimestamp();
    const level = this.getColoredLevel('info');
    const context = this.getColoredContext();
    const content = this.formatWithMeta(message, meta);

    console.log(`${timestamp} ${level} ${context} ${content}`);
  }

  error(message: string, trace?: string, meta?: Record<string, any>) {
    const timestamp = this.getColoredTimestamp();
    const level = this.getColoredLevel('error');
    const context = this.getColoredContext();
    const content = this.formatWithMeta(message, meta);

    console.error(`${timestamp} ${level} ${context} ${content}`);
    if (trace) {
      console.error(chalk.red.dim(trace));
    }
  }

  warn(message: string, meta?: Record<string, any>) {
    const timestamp = this.getColoredTimestamp();
    const level = this.getColoredLevel('warn');
    const context = this.getColoredContext();
    const content = this.formatWithMeta(message, meta);

    console.warn(`${timestamp} ${level} ${context} ${content}`);
  }

  debug(message: string, meta?: Record<string, any>) {
    const timestamp = this.getColoredTimestamp();
    const level = this.getColoredLevel('debug');
    const context = this.getColoredContext();
    const content = this.formatWithMeta(message, meta);

    console.debug(`${timestamp} ${level} ${context} ${content}`);
  }

  verbose(message: string, meta?: Record<string, any>) {
    const timestamp = this.getColoredTimestamp();
    const level = this.getColoredLevel('verbose');
    const context = this.getColoredContext();
    const content = this.formatWithMeta(message, meta);

    console.log(`${timestamp} ${level} ${context} ${content}`);
  }
}