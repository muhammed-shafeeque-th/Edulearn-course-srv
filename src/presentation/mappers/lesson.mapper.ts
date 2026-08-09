import {
  ContentMetaData,
  LessonData,
} from "src/infrastructure/grpc/generated/course/types/lesson";
import { Lesson } from "@/domain/entities/lesson.entity";

export class LessonMapper {
  /**
   * Converts this LessonDto instance into a gRPC LessonData object.
   */
  static toGrpcResponse(lesson: Lesson): LessonData {
    return {
      id: lesson.getId(),
      moduleId: lesson.getModuleId(),
      title: lesson.getTitle(),
      description: lesson.getDescription(),
      contentType: lesson.getContentType(),
      contentUrl: lesson.getContentUrl(),
      order: lesson.getOrder(),
      metadata: (lesson.getMetadata() || {}) as unknown as ContentMetaData,
      isPreview: lesson.getIsPreview(),
      isPublished: lesson.getIsPublished(),
      estimatedDuration: lesson.getDuration(),
      createdAt: lesson.getCreatedAt().toISOString(),
      updatedAt: lesson.getUpdatedAt().toDateString(),
      deletedAt: lesson.getDeletedAt()?.toDateString(),
    };
  }
}
