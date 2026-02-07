import { IsString, IsNotEmpty } from "class-validator";
import { CreateSectionRequest } from "src/infrastructure/grpc/generated/course/types/section";

export class CreateSectionRequestDto implements CreateSectionRequest {
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
