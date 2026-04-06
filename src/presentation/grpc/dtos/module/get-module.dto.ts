import { IsString, IsNotEmpty } from "class-validator";
import { GetModuleRequest } from "src/infrastructure/grpc/generated/course/types/module";

export class GetModuleRequestDto implements GetModuleRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
