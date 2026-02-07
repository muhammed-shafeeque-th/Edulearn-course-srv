import { IsNotEmpty, IsString } from "class-validator";
import { GetCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";

export class GetCourseRequestDto implements GetCourseRequest{
  @IsNotEmpty({ message: "Course ID is required" })
  @IsString({ message: "Course ID must be a string" })
  courseId: string;
}
