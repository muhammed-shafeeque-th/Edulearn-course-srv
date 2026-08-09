import { Lesson } from "@/domain/entities/lesson.entity";

export abstract class IGetLessonUseCase {
  abstract execute(lessonId: string): Promise<Lesson>;
}
