import { Lesson } from "@/domain/entities/lesson.entity";
import { UpdateLessonDto } from "src/presentation/grpc/dtos/lesson/update-lesson.dto";

export abstract class IUpdateLessonUseCase {
  abstract execute(dto: UpdateLessonDto): Promise<Lesson>;
}
