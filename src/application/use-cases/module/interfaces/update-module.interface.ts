import { ModuleDto } from "src/application/dtos/module.dto";
import { UpdateModuleDto } from "src/presentation/grpc/dtos/module/update-module.dto";

export abstract class IUpdateModuleUseCase {
  abstract execute(dto: UpdateModuleDto): Promise<ModuleDto>;
}
