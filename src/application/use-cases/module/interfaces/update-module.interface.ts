import { Module } from "@/domain/entities/module.entity";
import { UpdateModuleDto } from "src/presentation/grpc/dtos/module/update-module.dto";

export abstract class IUpdateModuleUseCase {
  abstract execute(dto: UpdateModuleDto): Promise<Module>;
}
