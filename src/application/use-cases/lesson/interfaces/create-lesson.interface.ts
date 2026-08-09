import { Lesson } from "@/domain/entities/lesson.entity";
import { CreateLessonDto } from "src/presentation/grpc/dtos/lesson/create-lesson.dto";

export abstract class ICreateLessonUseCase {
  abstract execute(
    dto: CreateLessonDto,
    idempotencyKey: string,
  ): Promise<Lesson>;
}
