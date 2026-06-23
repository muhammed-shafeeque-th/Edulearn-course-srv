import { ModuleDto } from "src/application/dtos/module.dto";

export abstract class IGetModuleUseCase {
  abstract execute(moduleId: string): Promise<ModuleDto>;
}
