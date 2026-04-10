import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { DeleteModuleRequest } from "src/infrastructure/grpc/generated/course/types/module";

export class DeleteModuleDto implements DeleteModuleRequest {
  @IsNotEmpty()
  @IsString()
  moduleId: string;
  @IsNotEmpty()
  @IsString()
  userId: string;
  @IsNotEmpty()
  @IsString()
  courseId: string;
}
