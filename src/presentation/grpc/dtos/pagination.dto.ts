import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { Pagination } from "src/infrastructure/grpc/generated/course/common";

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export class PaginationDto implements Pagination{
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Page must be an integer" })
  @Min(1, { message: "Page must be at least 1" })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be at least 1" })
  pageSize: number = 10;

  @IsOptional()
  @IsString({ message: "Sort by must be a string" })
  sortBy: string = "createdAt";

  @IsOptional()
  @IsEnum(SortOrder, { message: "Sort order must be ASC or DESC" })
  sortOrder: SortOrder = SortOrder.ASC;
}
