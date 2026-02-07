import {
  IsOptional,
  IsInt,
  IsPositive,
  IsString,
  IsEnum,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../pagination.dto";


export class CourseFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;
  
  @IsOptional()
  @IsString()
  status?: string;


  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsArray()
  @IsString({ each: true })
  level: string[];

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}

export class GetCoursesParamsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseFiltersDto)
  filters?: CourseFiltersDto;
}


export class GetCoursesRequestDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GetCoursesParamsDto)
  params?: GetCoursesParamsDto;
}
