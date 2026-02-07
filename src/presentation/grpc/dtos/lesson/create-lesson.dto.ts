import { IsString, IsNotEmpty, IsNumber } from "class-validator";
import { ContentMetaData, CreateLessonRequest } from "src/infrastructure/grpc/generated/course/types/lesson";

export class CreateLessonDto implements CreateLessonRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;
  
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  // @IsString()
  // @IsNotEmpty()
  // content: string;

  // @IsNumber()

  contentType?: string;
  contentUrl?: string;
  description?: string;
  estimatedDuration?: number;
  isPreview?: boolean;
  isPublished?: boolean;
  metadata: ContentMetaData;
  order?: number;
}
