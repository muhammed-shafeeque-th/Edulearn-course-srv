import { ContentMetaData, LessonData } from "src/infrastructure/grpc/generated/course/types/lesson";
import {
  ContentMetadata,
  ContentType,
  Lesson,
} from "../../domain/entities/lesson.entity";

export class LessonDto {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  contentType?: ContentType;
  contentUrl?: string;
  order?: number;
  metadata?: ContentMetadata;
  isPreview?: boolean;
  isPublished?: boolean;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  static fromDomain(lesson: Lesson): LessonDto {
    const dto = new LessonDto();
    dto.id = lesson.getId();
    dto.sectionId = lesson.getSectionId();
    dto.title = lesson.getTitle();
    dto.description = lesson.getDescription();
    dto.contentType = lesson.getContentType();
    dto.contentUrl = lesson.getContentUrl();
    dto.order = lesson.getOrder();
    dto.metadata = lesson.getMetadata();
    dto.isPreview = lesson.getIsPreview();
    dto.isPublished = lesson.getIsPublished();
    dto.duration = lesson.getDuration();
    dto.createdAt = lesson.getCreatedAt();
    dto.updatedAt = lesson.getUpdatedAt();
    dto.deletedAt = lesson.getDeletedAt();
    return dto;
  }

  /**
   * Converts this LessonDto instance into a gRPC LessonData object.
   */
  toGrpcResponse(): LessonData {
    return {
      id: this.id,
      sectionId: this.sectionId,
      title: this.title,
      contentUrl: this.contentUrl,
      description: this.description ?? "",
      estimatedDuration: this.duration ?? 0,
      isPreview: this.isPreview ?? false,
      isPublished: this.isPublished ?? false,
      order: this.order ?? 0,
      metadata: (this.metadata || {}) as unknown as ContentMetaData,
      contentType: this.contentType,
      createdAt: this.createdAt ? this.createdAt.toISOString() : "",
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : "",
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
