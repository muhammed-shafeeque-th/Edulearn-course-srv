import { Injectable } from "@nestjs/common";
import {
  GetCourseParams,
  ICourseRepository,
} from "../../../domain/repositories/course.repository";
import { CourseDto } from "../../dtos/course.dto";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { GetCoursesParamsDto } from "src/presentation/grpc/dtos/course/get-courses-params.dto";
import { CourseStatus } from "src/domain/entities/course.entity";
import { CourseMetadataDto } from "src/application/dtos/courseMeta.dto";

@Injectable()
export class ListCoursesUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    params: GetCoursesParamsDto
  ): Promise<{ courses: CourseMetadataDto[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "ListCoursesUseCase.execute",
      async (span) => {
        this.logger.log(`Fetching all available courses `, {
          ctx: ListCoursesUseCase.name,
        });
        const queryFilters = this.mapQueryFilters(params);

        const { courses, total } =
          await this.courseRepository.findAll(queryFilters);
        const courseDtos = courses.map(CourseMetadataDto.fromPrimitive);

        span.setAttribute("course.length", courseDtos.length);

        this.logger.log(`Fetch all available courses`, {
          ctx: ListCoursesUseCase.name,
        });
        return { courses: courseDtos, total };
      }
    );
  }

  /**
   * Maps the incoming DTO params to a sanitized and validated query object
   */
  private mapQueryFilters(params: GetCoursesParamsDto): GetCourseParams {
    // Allowed sort fields (whitelist to avoid SQL injection etc.)
    const ALLOWED_SORT_FIELDS = [
      "updatedAt",
      "createdAt",
      "title",
      "price",
      "rating",
    ];
    const ALLOWED_SORT_ORDERS = ["ASC", "DESC"];

    // Updated sort options (used for UI or allowed sort inputs if relevant)
    // Maps sort option keywords to backend field/order values
    const SORT_OPTION_MAP: Record<
      string,
      { sortBy: string; sortOrder: "ASC" | "DESC" }
    > = {
      latest: { sortBy: "updatedAt", sortOrder: "DESC" },
      popular: { sortBy: "rating", sortOrder: "DESC" }, // Adjust backend field as needed
      rating: { sortBy: "rating", sortOrder: "DESC" },
      "price-low": { sortBy: "price", sortOrder: "ASC" },
      "price-high": { sortBy: "price", sortOrder: "DESC" },
    };

    const pagination = params?.pagination;
    const filters = params?.filters;

    // Validate and sanitize sortBy
    let sortBy = pagination?.sortBy;
    if (!sortBy || !ALLOWED_SORT_FIELDS.includes(sortBy)) {
      sortBy = "updatedAt";
    }

    // Validate and sanitize sortOrder
    let sortOrder = (pagination?.sortOrder || "DESC").toUpperCase();
    if (!ALLOWED_SORT_ORDERS.includes(sortOrder)) {
      sortOrder = "DESC";
    }

    // Ensure pagination values
    let page =
      typeof pagination?.page === "number" && pagination.page > 0
        ? pagination.page
        : 1;
    let pageSize =
      typeof pagination?.pageSize === "number" && pagination.pageSize > 0
        ? pagination.pageSize
        : 10;

    // Sanitize search to strip special/injection characters ("", ', ;, --, etc., only allow normal text, numbers and basic symbols)
    let search: string | undefined = filters?.search;
    if (typeof search === "string") {
      // Remove dangerous characters, keep alphanum and space/basic punctuation
      // (adapt this as needed for your requirements)
      search = search
        .replace(/[;"'`\\]/g, "") // Remove special SQL-like chars
        .replace(/--/g, "") // Remove SQL comment pattern
        .replace(/[<>]/g, "") // Remove angle brackets
        .replace(/[\x00-\x1F\x7F]/g, ""); // Non-printable/control chars
      search = search.trim();
    }

    // Map filters, keeping only allowed and sanitized fields
    const mappedFilters = {} as GetCourseParams;
    if (filters?.status)
      mappedFilters.status = this.mapCourseStatus(filters.status);
    if (search) mappedFilters.search = search;
    if (Array.isArray(filters?.category))
      mappedFilters.category = filters.category;
    if (Array.isArray(filters?.level)) mappedFilters.level = filters.level;
    if (typeof filters?.minPrice === "number")
      mappedFilters.minPrice = filters.minPrice;
    if (typeof filters?.maxPrice === "number")
      mappedFilters.maxPrice = filters.maxPrice;
    if (typeof filters?.rating === "number")
      mappedFilters.rating = filters.rating;

    return {
      page,
      limit: pageSize,
      sortBy,
      sortOrder,
      ...SORT_OPTION_MAP[pagination?.sortBy],
      ...mappedFilters,
    };
  }

  private mapCourseStatus(status: string): CourseStatus {
    switch (status) {
      case "published":
        return CourseStatus.PUBLISHED;
      case "unpublished":
        return CourseStatus.UNPUBLISHED;
      case "deleted":
        return CourseStatus.DELETED;
      case "draft":
        return CourseStatus.DRAFT;
      default:
        throw new Error("Invalid course status provided");
    }
  }
}
