import { LessonDto } from "src/application/dtos/lesson.dto";

export abstract class IGetLessonUseCase {
  abstract execute(lessonId: string): Promise<LessonDto>;
}
