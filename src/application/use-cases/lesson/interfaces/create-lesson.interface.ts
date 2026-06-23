import { LessonDto } from "src/application/dtos/lesson.dto";
import { CreateLessonDto } from "src/presentation/grpc/dtos/lesson/create-lesson.dto";

export abstract class ICreateLessonUseCase {
  abstract execute(
    dto: CreateLessonDto,
    idempotencyKey: string,
  ): Promise<LessonDto>;
}
