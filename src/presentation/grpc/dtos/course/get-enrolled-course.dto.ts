import { IsString, IsNotEmpty } from "class-validator";
import { Pagination } from "src/infrastructure/grpc/generated/course/common";

export class GetEnrolledCoursesRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  pagination: Pagination;
}
