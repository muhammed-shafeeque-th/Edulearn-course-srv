import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from "class-validator";
import { User } from "src/infrastructure/grpc/generated/course/common";
import { CreateCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";

export class CreateCourseRequestDto implements CreateCourseRequest {
  @IsNotEmpty({ message: "Title is required" })
  @IsString({ message: "Title must be a string" })
  @Length(3, 100, { message: "Title must be between 3 and 100 characters" })
  title: string;

  @IsNotEmpty({ message: "Description is required" })
  @IsString({ message: "Description must be a string" })
  @Length(10, 500, {
    message: "Description must be between 10 and 500 characters",
  })
  description: string;

  @IsNotEmpty({ message: "Instructor ID is required" })
  @IsString({ message: "Instructor ID must be a string" })
  instructorId: string;

  @IsOptional()
  @IsString({ message: "category must be a string" })
  category: string;

  instructor: InstructorDto;



  @IsOptional()
  @IsString({ message: "category must be a string" })
  durationUnit: string;

  @IsOptional()
  @IsString({ message: "category must be a string" })
  durationValue: string;

  language: string;

  @IsOptional()
  @IsString({ message: "category must be a string" })
  level: string;

  @IsOptional()
  @IsString({ message: "category must be a string" })
  subCategory: string;

  @IsOptional()
  @IsString({ message: "category must be a string" })
  subTitle: string;

  subtitleLanguage: string;

  topics: string[];
}

class InstructorDto implements User {
  @IsString()
  avatar: string;
  
  @IsOptional()
  email?: string;

  @IsString()
  id: string;

  @IsString()
  name: string;


}
