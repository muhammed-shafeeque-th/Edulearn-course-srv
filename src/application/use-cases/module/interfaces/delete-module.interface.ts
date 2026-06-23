import { DeleteModuleDto } from "src/presentation/grpc/dtos/module/delete-module.dto";

export abstract class IDeleteModuleUseCase {
  abstract execute(dto: DeleteModuleDto): Promise<void>;
}
