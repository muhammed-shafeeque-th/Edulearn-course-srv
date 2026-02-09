import { IsNotEmpty, IsString } from "class-validator";
import { PaginationDto } from "../pagination.dto";

export class GetCoursesByInstructorRequestDto {
  @IsNotEmpty({ message: "Instructor ID is required" })
  @IsString({ message: "Instructor ID must be a string" })
  instructorId: string;

  pagination?: PaginationDto;
}
