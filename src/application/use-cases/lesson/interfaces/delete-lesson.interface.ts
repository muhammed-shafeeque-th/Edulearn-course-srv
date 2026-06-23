import { DeleteLessonDto } from "src/presentation/grpc/dtos/lesson/delete-lesson.dto";

export abstract class IDeleteLessonUseCase {
  abstract execute(dto: DeleteLessonDto): Promise<void>;
}
