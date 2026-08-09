import { Module } from "@/domain/entities/module.entity";

export abstract class IGetModuleUseCase {
  abstract execute(moduleId: string): Promise<Module>;
}
