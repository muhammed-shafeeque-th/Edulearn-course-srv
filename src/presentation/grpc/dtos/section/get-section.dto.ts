import { IsString, IsNotEmpty } from "class-validator";
import { GetSectionRequest } from "src/infrastructure/grpc/generated/course/types/section";

export class GetSectionRequestDto implements GetSectionRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
