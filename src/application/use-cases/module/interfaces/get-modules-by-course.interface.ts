import { ModuleDto } from "src/application/dtos/module.dto";

export abstract class IGetModulesByCourseUseCase {
  abstract execute(courseId: string): Promise<ModuleDto[]>;
}
