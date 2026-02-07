import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { UpdateSectionRequest } from "src/infrastructure/grpc/generated/course/types/section";

export class UpdateSectionDto implements UpdateSectionRequest {
    @IsNotEmpty()
    @IsString()
    sectionId: string;
    @IsNotEmpty()
    @IsString()
    userId: string;
    @IsNotEmpty()
    @IsString()
    courseId: string;
    @IsNotEmpty()
    @IsString()
    title: string;
    @IsNotEmpty()
    @IsString()
    description: string;
    @IsNotEmpty()
    @IsBoolean()
    isPublished: boolean;
    @IsNotEmpty()
    @IsNumber()
    order: number;
  }