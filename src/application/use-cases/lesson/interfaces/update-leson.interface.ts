import { LessonDto } from "src/application/dtos/lesson.dto";
import { UpdateLessonDto } from "src/presentation/grpc/dtos/lesson/update-lesson.dto";

export abstract class IUpdateLessonUseCase {
  abstract execute(dto: UpdateLessonDto): Promise<LessonDto>;
}
