import { IsString, IsNotEmpty } from "class-validator";
import { DeleteCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";

export class DeleteCourseRequestDto implements DeleteCourseRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
