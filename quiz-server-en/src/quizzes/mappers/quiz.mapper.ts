// src/modules/quizzes/mappers/quiz.mapper.ts

import { Injectable } from '@nestjs/common';
import { QuizModel, QuestionModel, AnswerModel } from '../models/quiz.model';
import { QuizResponseDto } from '../dto/quiz-response.dto';
/**
 * Mapper для преобразования Quiz между слоями
 * 
 * Information Expert (GRASP):
 * - Знает как конвертировать Prisma → Model → DTO
 * 
 * Single Responsibility (SOLID):
 * - ТОЛЬКО маппинг данных
 */
@Injectable()
export class QuizMapper {
  /**
   * Из Prisma в Domain Model
   */
  toDomain(prismaQuiz: any): QuizModel {
    return new QuizModel({
      id: prismaQuiz.id,
      title: prismaQuiz.title,
      titleAdm: prismaQuiz.titleAdm,
      description: prismaQuiz.description,
      descriptionAdm: prismaQuiz.descriptionAdm,
      descrip: prismaQuiz.descrip,
      quizShortTitle: prismaQuiz.quizShortTitle,
      firstPage: prismaQuiz.firstPage,
      finalPage: prismaQuiz.finalPage,
      isActive: prismaQuiz.isActive,
      isMainView: prismaQuiz.isMainView,
      previewImage: prismaQuiz.previewImage,
      categoryId: prismaQuiz.categoryId,
      rating: prismaQuiz.rating ? Number(prismaQuiz.rating) : null,
      type: prismaQuiz.type,
      resultMessages: this.parseJson(prismaQuiz.resultMessages),
      quizInfo: this.parseJson(prismaQuiz.quizInfo),
      createdAt: prismaQuiz.createdAt,
      updatedAt: prismaQuiz.updatedAt,
      questions: prismaQuiz.questions?.map(q => this.questionToDomain(q)),
      category: prismaQuiz.category,
    });
  }

  /**
   * Из Question Prisma в Model
   */
  private questionToDomain(prismaQuestion: any): QuestionModel {
    return new QuestionModel({
      id: prismaQuestion.id,
      text: prismaQuestion.text,
      image: prismaQuestion.image,
      order: prismaQuestion.order,
      quizId: prismaQuestion.quizId,
      answers: prismaQuestion.answers?.map(a => this.answerToDomain(a)),
    });
  }

  /**
   * Из Answer Prisma в Model
   */
  private answerToDomain(prismaAnswer: any): AnswerModel {
    return new AnswerModel({
      id: prismaAnswer.id,
      text: prismaAnswer.text,
      isCorrect: prismaAnswer.isCorrect,
      points: prismaAnswer.points,
      questionId: prismaAnswer.questionId,
    });
  }

  /**
   * Из Domain Model в Response DTO
   */
  toResponse(model: QuizModel): QuizResponseDto {
    return {
      id: model.id,
      title: model.title,
      titleAdm: model.titleAdm,            
      description: model.description,
      firstPage: model.firstPage,
      finalPage: model.finalPage,
      descriptionAdm: model.descriptionAdm,  
      descrip: model.descrip,                
      quizShortTitle: model.quizShortTitle,  
      isActive: model.isActive,
      previewImage: model.previewImage,
      rating: model.rating,
      type: model.type,
      resultMessages: model.resultMessages,
      quizInfo: model.quizInfo,
      isMainView: model.isMainView,
      questionCount: model.getQuestionCount(),
      questions: model.questions?.map(q => ({
        id: q.id,
        text: q.text,
        image: q.image,
        order: q.order,
        answers: q.answers?.map(a => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect,
          points: a.points,
        })),
      })),
      category: model.category,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }

  /**
   * Массив моделей в массив DTO
   */
  toResponseArray(models: QuizModel[]): QuizResponseDto[] {
    return models.map(model => this.toResponse(model));
  }

  /**
   * Парсинг JSON из БД
   */
  private parseJson(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Сериализация для БД
   */
  stringifyJson(value: any): string | null {
    if (!value) return null;
    return JSON.stringify(value);
  }
}