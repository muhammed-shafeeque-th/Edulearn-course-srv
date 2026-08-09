import { ModuleData } from "src/infrastructure/grpc/generated/course/types/module";
import { Module } from "../../domain/entities/module.entity";
import { LessonMapper } from "./lesson.mapper";
import { QuizMapper } from "./quiz.mapper";

export class ModuleMapper {
  static toGrpcResponse(module: Module): ModuleData {
    return {
      id: module.getId(),
      courseId: module.getCourseId(),
      title: module.getTitle(),
      isPublished: module.getIsPublished(),
      description: module.getDescription(),
      order: module.getOrder(),
      lessons: module.getLessons().map(LessonMapper.toGrpcResponse),
      quiz: module.getQuiz()
        ? QuizMapper.toGrpcResponse(module.getQuiz())
        : undefined,
      createdAt: module.getCreatedAt().toISOString(),
      updatedAt: module.getUpdatedAt().toISOString(),
      deletedAt: module.getDeletedAt()?.toISOString(),
    };
  }
}
