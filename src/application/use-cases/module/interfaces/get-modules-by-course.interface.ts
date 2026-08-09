import { Module } from "@/domain/entities/module.entity";

export abstract class IGetModulesByCourseUseCase {
  abstract execute(courseId: string): Promise<Module[]>;
}
