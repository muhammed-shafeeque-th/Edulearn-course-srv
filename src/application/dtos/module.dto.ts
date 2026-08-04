import { ModuleData } from "src/infrastructure/grpc/generated/course/types/module";
import { Module } from "../../domain/entities/module.entity";
import { LessonDto } from "./lesson.dto";
import { QuizDto } from "./quiz.dto";

export class ModuleDto {
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

  static fromDomain(module: Module): ModuleDto {
    const dto = new ModuleDto();
    dto.id = module.getId();
    dto.courseId = module.getCourseId();
    dto.title = module.getTitle();
    dto.isPublished = module.getIsPublished();
    dto.description = module.getDescription();
    dto.order = module.getOrder();
    dto.lessons = module.getLessons().map(LessonDto.fromDomain);
    dto.quiz = module.getQuiz()
      ? QuizDto.fromDomain(module.getQuiz())
      : undefined;
    dto.createdAt = module.getCreatedAt();
    dto.updatedAt = module.getUpdatedAt();
    dto.deletedAt = module.getDeletedAt();
    return dto;
  }

  public toGrpcResponse = (): ModuleData => {
    return {
      id: this.id,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      isPublished: this.isPublished,
      order: this.order,
      quiz: this.quiz ? this.quiz.toGrpcResponse() : undefined,
      lessons: this.lessons?.map((lesson) => lesson.toGrpcResponse()),
      createdAt: this.createdAt?.toISOString?.(),
      updatedAt: this.updatedAt?.toISOString?.(),
      deletedAt: this.deletedAt ? this.deletedAt?.toISOString() : null,
    };
  };
}
