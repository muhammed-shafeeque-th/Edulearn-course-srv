import { IsNotEmpty, IsString } from "class-validator";
import { GetCourseBySlugRequest } from "src/infrastructure/grpc/generated/course/types/course";

export class GetCourseBySlugRequestDto implements GetCourseBySlugRequest{
  @IsNotEmpty({ message: "Course ID is required" })
  @IsString({ message: "Course ID must be a string" })
  slug: string;
}
