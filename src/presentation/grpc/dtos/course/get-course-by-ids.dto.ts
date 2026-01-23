import { ArrayMinSize, IsArray } from "class-validator";
import { GetCoursesByIdsRequest } from "src/infrastructure/grpc/generated/course/types/course";

export class GetCourseByIdsRequestDto implements GetCoursesByIdsRequest{

  @IsArray()
  @ArrayMinSize(1)
  // @ValidateNested({ each: true })
  // @Type(() => ItemDto)
  courseIds: string[];
}
