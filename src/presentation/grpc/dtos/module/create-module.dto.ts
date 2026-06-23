import { IsString, IsNotEmpty } from "class-validator";
import { CreateModuleRequest } from "src/infrastructure/grpc/generated/course/types/module";

export class CreateModuleRequestDto implements CreateModuleRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  description?: string;

  isPublished: boolean;

  order: number;
}
