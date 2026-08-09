import { Lesson } from "@/domain/entities/lesson.entity";

export abstract class IGetLessonsByModuleUseCase {
  abstract execute(moduleId: string): Promise<Lesson[]>;
}
