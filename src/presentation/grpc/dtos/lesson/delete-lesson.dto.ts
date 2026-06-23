import { IsString, IsNotEmpty, IsNumber } from "class-validator";
import { DeleteLessonRequest } from "src/infrastructure/grpc/generated/course/types/lesson";

export class DeleteLessonDto implements DeleteLessonRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
