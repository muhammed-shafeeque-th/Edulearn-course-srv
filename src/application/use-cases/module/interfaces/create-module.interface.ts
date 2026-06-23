import { ModuleDto } from "src/application/dtos/module.dto";
import { CreateModuleRequestDto } from "src/presentation/grpc/dtos/module/create-module.dto";

export abstract class ICreateModuleUseCase {
  abstract execute(
    dto: CreateModuleRequestDto,
    idempotencyKey: string,
  ): Promise<ModuleDto>;
}
