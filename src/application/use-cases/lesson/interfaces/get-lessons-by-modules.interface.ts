import { LessonDto } from "src/application/dtos/lesson.dto";

export abstract class IGetLessonsByModuleUseCase {
  abstract execute(moduleId: string): Promise<LessonDto[]>;
}
