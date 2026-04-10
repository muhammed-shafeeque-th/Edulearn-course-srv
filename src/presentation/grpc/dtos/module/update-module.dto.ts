import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { UpdateModuleRequest } from "src/infrastructure/grpc/generated/course/types/module";

export class UpdateModuleDto implements UpdateModuleRequest {
  @IsNotEmpty()
  @IsString()
  moduleId: string;
  @IsNotEmpty()
  @IsString()
  userId: string;
  @IsNotEmpty()
  @IsString()
  courseId: string;
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsNotEmpty()
  @IsString()
  description: string;
  @IsNotEmpty()
  @IsBoolean()
  isPublished: boolean;
  @IsNotEmpty()
  @IsNumber()
  order: number;
}
