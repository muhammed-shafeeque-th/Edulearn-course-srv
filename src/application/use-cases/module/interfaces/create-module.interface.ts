import { Module } from "@/domain/entities/module.entity";
import { CreateModuleRequestDto } from "src/presentation/grpc/dtos/module/create-module.dto";

export abstract class ICreateModuleUseCase {
  abstract execute(
    dto: CreateModuleRequestDto,
    idempotencyKey: string,
  ): Promise<Module>;
}
