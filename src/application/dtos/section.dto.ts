import { SectionData } from "src/infrastructure/grpc/generated/course/types/section";
import { Section } from "../../domain/entities/section.entity";
import { LessonDto } from "./lesson.dto";
import { QuizDto } from "./quiz.dto";

export class SectionDto {
  id: string;
  courseId: string;
  title: string;
  order: number;
  isPublished: boolean;
  description: string;
  lessons: LessonDto[];
  quiz?: QuizDto;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  static fromDomain(section: Section): SectionDto {
    const dto = new SectionDto();
    dto.id = section.getId();
    dto.courseId = section.getCourseId();
    dto.title = section.getTitle();
    dto.isPublished = section.getIsPublished();
    dto.description = section.getDescription();
    dto.order = section.getOrder();
    dto.lessons = section.getLessons().map(LessonDto.fromDomain);
    dto.quiz = section.getQuiz()? QuizDto.fromDomain(section.getQuiz()) : undefined;
    dto.createdAt = section.getCreatedAt();
    dto.updatedAt = section.getUpdatedAt();
    dto.deletedAt = section.getDeletedAt();
    return dto;
  }

  public toGrpcResponse = (): SectionData => {
    return {
      id: this.id,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      isPublished: this.isPublished,
      order: this.order,
      quiz: this.quiz ? this.quiz.toGrpcResponse() : undefined,
      lessons: this.lessons?.map(lesson => lesson.toGrpcResponse()),
      createdAt: this.createdAt?.toISOString?.(),
      updatedAt: this.updatedAt?.toISOString?.(),
      deletedAt: this.deletedAt ? this.deletedAt?.toISOString() : null,
    };
  };
}
