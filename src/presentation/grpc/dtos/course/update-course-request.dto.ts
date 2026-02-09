import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from "class-validator";
import { CourseStatus } from "src/domain/entities/course.entity";
import { UpdateCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";

export class UpdateCourseRequestDto implements UpdateCourseRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  category?: string;

  durationUnit?: string;

  durationValue?: string;

  instructorId?: string;

  language?: string;

  learningOutcomes: string[];

  level?: string;

  requirements: string[];

  subCategory?: string;

  subTitle?: string;

  subtitleLanguage?: string;

  targetAudience: string[];

  thumbnail?: string;

  topics: string[];

  trailer?: string;



  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: "Price must be type number" }
  )
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: "Price must be type number" }
  )
  @Min(0)
  discountPrice: number;


  currency?: string
}
