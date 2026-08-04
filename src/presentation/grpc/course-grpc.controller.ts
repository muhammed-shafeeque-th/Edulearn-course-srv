import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ICreateCourseUseCase } from "src/application/use-cases/course/interfaces/create-course.interface";

import { IUpdateCourseUseCase } from "src/application/use-cases/course/interfaces/update-course.interface";
import { UpdateCourseRequestDto } from "./dtos/course/update-course-request.dto";
import { GetCourseRequestDto } from "./dtos/course/get-course.dto";
import { CreateCourseRequestDto } from "./dtos/course/create-course.dto";
import { DeleteCourseRequestDto } from "./dtos/course/delete-course.dto";
import { IDeleteCourseUseCase } from "src/application/use-cases/course/interfaces/delete-course.interface";
import { GetCoursesByInstructorRequestDto } from "./dtos/course/get-course-by-instructor.dto";
import { IGetCoursesByInstructorUseCase } from "src/application/use-cases/course/interfaces/get-courses-by-instructor.interface";
import { GetCoursesRequestDto } from "./dtos/course/get-courses-params.dto";
import { IGetCourseUseCase } from "src/application/use-cases/course/interfaces/get-course.interface";
import { IGetEnrolledCoursesUseCase } from "src/application/use-cases/course/interfaces/get-enrolled-courses.interface";
import { IListCoursesUseCase } from "src/application/use-cases/course/interfaces/list-courses.interface";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { GetCourseBySlugRequestDto } from "./dtos/course/get-course-by-slug.dto";
import { IGetCourseBySlugUseCase } from "src/application/use-cases/course/interfaces/get-course-by-slug.interface";
import { IGetCoursesByIdsUseCase } from "src/application/use-cases/course/interfaces/get-course-by-ids.interface";
import { GetCourseByIdsRequestDto } from "./dtos/course/get-course-by-ids.dto";
import { Metadata } from "@grpc/grpc-js";
import { getMetadataValues } from "src/shared/utils/get-metadata";
import { GetEnrolledCoursesRequestDto } from "./dtos/course/get-enrolled-course.dto";
import { Empty, Error } from "src/infrastructure/grpc/generated/course/common";
import {
  CourseResponse,
  CoursesListResponse,
  DeleteCourseResponse,
  GetCoursesByIdsResponse,
  PublishCourseRequest,
} from "src/infrastructure/grpc/generated/course/types/course";
import { IUnPublishCourseUseCase } from "src/application/use-cases/course/interfaces/unpublish-course.interface";
import { IPublishCourseUseCase } from "src/application/use-cases/course/interfaces/publish-course.interface";
import {
  GetCoursesStatsResponse,
  GetInstructorCourseRatingStatsRequest,
  GetInstructorCourseRatingStatsResponse,
  GetInstructorCoursesStatsRequest,
  GetInstructorCoursesStatsResponse,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { IGetInstructorCoursesStatsUseCase } from "src/application/use-cases/course/interfaces/get-instructor-courses-stats.interface";
import { IGetCoursesStatsUseCase } from "src/application/use-cases/course/interfaces/get-courses-stats.interface";
import { IGetInstructorCourseRatingStatsUseCase } from "src/application/use-cases/course/interfaces/get-instructor-course-rating-stats.interface";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class CourseGrpcController {
  constructor(
    private readonly _createCourseUseCase: ICreateCourseUseCase,
    private readonly _getCourseUseCase: IGetCourseUseCase,
    private readonly _getCourseBySlugUseCase: IGetCourseBySlugUseCase,
    private readonly _listCoursesUseCase: IListCoursesUseCase,
    private readonly _getCoursesByIdsUseCase: IGetCoursesByIdsUseCase,
    private readonly _updateCourseUseCase: IUpdateCourseUseCase,
    private readonly _deleteCourseUseCase: IDeleteCourseUseCase,
    private readonly _publishCourseUseCase: IPublishCourseUseCase,
    private readonly _unPublishCourseUseCase: IUnPublishCourseUseCase,
    private readonly _getCoursesByInstructorUseCase: IGetCoursesByInstructorUseCase,
    private readonly _getEnrolledCoursesUseCase: IGetEnrolledCoursesUseCase,
    private readonly _getInstructorCoursesStatsUseCase: IGetInstructorCoursesStatsUseCase,
    private readonly _getInstructorCourseRatingStatsUseCase: IGetInstructorCourseRatingStatsUseCase,
    private readonly _getCoursesStatsUseCase: IGetCoursesStatsUseCase,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.code,
      message: error.message,
      details:
        "serializeError" in error && typeof error.serializeError === "function"
          ? error.serializeError()
          : [{ message: error.message }],
    };
  }

  @GrpcMethod("CourseService", "CreateCourse")
  async createCourse(
    data: CreateCourseRequestDto,
    metadata: Metadata,
  ): Promise<CourseResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.CreateCourse",
        async (span) => {
          span.setAttribute("course.title", data.title);
          span.setAttribute("course.instructor.id", data.instructorId);

          this._logger.debug(`gRPC: Creating course: ${data.title}`, {
            ctx: CourseGrpcController.name,
          });

          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const courseDto = await this._createCourseUseCase.execute(
            data,
            idempotencyKey,
          );

          return {
            course: courseDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to create course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetCourse")
  async getCourse(
    data: GetCourseRequestDto,
    metadata: Metadata,
  ): Promise<CourseResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.GetCourse",
        async (span) => {
          this._logger.debug(`gRPC: Fetching course: ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });
          span.setAttribute("course.id", data.courseId);
          const courseDto = await this._getCourseUseCase.execute(data.courseId);

          return {
            course: courseDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetCourseBySlug")
  async getCourseBySlug(
    data: GetCourseBySlugRequestDto,
    metadata: Metadata,
  ): Promise<CourseResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.GetCourseBySlug",
        async (span) => {
          this._logger.debug(`gRPC: Fetching course: ${data.slug}`, {
            ctx: CourseGrpcController.name,
          });
          span.setAttribute("course.slug", data.slug);
          const courseDto = await this._getCourseBySlugUseCase.execute(
            data.slug,
          );

          return {
            course: courseDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "getCourses")
  async getCourses(
    data: GetCoursesRequestDto,
    metadata: Metadata,
  ): Promise<CoursesListResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.GetCourse",
        async (span) => {
          this._logger.debug(
            `gRPC: Fetching courses page: ${data.params?.pagination.page} pageSize: ${data.params?.pagination?.pageSize} }`,
            {
              ctx: CourseGrpcController.name,
            },
          );
          span.setAttribute("course.page", data.params?.pagination?.page);
          span.setAttribute(
            "course.pageSize",
            data.params?.pagination?.pageSize,
          );
          span.setAttribute("course.sortBy", data.params?.pagination?.sortBy);
          span.setAttribute(
            "course.sortOrder",
            data.params?.pagination?.sortOrder,
          );

          const { courses: courseDtos, total } =
            await this._listCoursesUseCase.execute(data.params);

          return {
            courses: {
              courses: courseDtos?.map((course) => course.toGrpcResponse()),
              total,
            },
          } as CoursesListResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get all courses: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetCoursesByIds")
  async getCoursesByIds(
    data: GetCourseByIdsRequestDto,
    metadata: Metadata,
  ): Promise<GetCoursesByIdsResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.GetCourse",
        async (span) => {
          this._logger.debug(
            `gRPC: Fetching courses for ${data.courseIds?.length} ids`,
            {
              ctx: CourseGrpcController.name,
            },
          );

          const { courses: courseDtos } =
            await this._getCoursesByIdsUseCase.execute(data);

          return {
            success: {
              courses: {
                courses: courseDtos?.map((course) => course.toGrpcResponse()),
              },
            },
          } as GetCoursesByIdsResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get all courses: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("CourseService", "UpdateCourse")
  async updateCourse(
    data: UpdateCourseRequestDto,
    metadata: Metadata,
  ): Promise<CourseResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.UpdateCourse",
        async (span) => {
          this._logger.log(`gRPC: Updating course ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });
          span.setAttribute("course.id", data.courseId);

          const courseDto = await this._updateCourseUseCase.execute(data);
          return {
            course: courseDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to update course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "DeleteCourse")
  async deleteCourse(
    data: DeleteCourseRequestDto,
    metadata: Metadata,
  ): Promise<DeleteCourseResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.DeleteCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this._logger.log(`gRPC: Deleting course ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });

          await this._deleteCourseUseCase.execute(data);
          return { success: { deleted: true } } as DeleteCourseResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to delete course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("CourseService", "PublishCourse")
  async publishCourse(
    data: PublishCourseRequest,
    metadata: Metadata,
  ): Promise<CourseResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.PublishCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this._logger.log(`gRPC: Deleting course ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });

          const result = await this._publishCourseUseCase.execute(data);
          return { course: result.toGrpcResponse() };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to publish course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("CourseService", "UnPublishCourse")
  async unPublishCourse(
    data: PublishCourseRequest,
    metadata: Metadata,
  ): Promise<CourseResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.UnPublishCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this._logger.log(`gRPC: Deleting course ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });

          const result = await this._unPublishCourseUseCase.execute(data);
          return { course: result.toGrpcResponse() };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to un publish course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetCoursesByInstructor")
  async getCoursesByInstructor(
    data: GetCoursesByInstructorRequestDto,
    metadata: Metadata,
  ): Promise<CoursesListResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.GetCoursesByInstructor",
        async (span) => {
          span.setAttribute("course.instructor.id", data.instructorId);
          span.setAttribute("course.page", data.pagination?.page);
          span.setAttribute("course.pageSize", data.pagination?.pageSize);
          span.setAttribute("course.sortBy", data.pagination?.sortBy);
          span.setAttribute("course.sortOrder", data.pagination?.sortOrder);

          this._logger.log(
            `gRPC: Fetching courses for instructor ${data.instructorId}`,
            { ctx: CourseGrpcController.name },
          );
          const { courses: courseDtos, total } =
            await this._getCoursesByInstructorUseCase.execute(
              data.instructorId,
              data.pagination?.page,
              data.pagination?.pageSize,
              data.pagination?.sortBy,
              (data.pagination?.sortOrder as any) || "DESC",
            );
          return {
            courses: {
              courses: courseDtos?.map((course) => course.toGrpcResponse()),
              total,
            },
          } as CoursesListResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(
        `Failed to get courses by instructor: ${error.message}`,
        { error },
      );

      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetInstructorCoursesStats")
  async getInstructorCoursesStats(
    data: GetInstructorCoursesStatsRequest,
    metadata: Metadata,
  ): Promise<GetInstructorCoursesStatsResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.GetInstructorCoursesStats",
        async (span) => {
          span.setAttribute("course.instructor.id", data.instructorId);

          this._logger.log(
            `gRPC: Fetching instructor's courses stats for ${data.instructorId}`,
            { ctx: CourseGrpcController.name },
          );

          const stats =
            await this._getInstructorCoursesStatsUseCase.execute(data);

          return {
            success: stats,
          };
        },
      );
    } catch (error: any) {
      this._logger.error(
        `Failed to get instructor courses stats: ${error.message}`,
        { error },
      );

      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetCoursesStats")
  async getCoursesStats(
    _data: Empty,
    _metadata: Metadata,
  ): Promise<GetCoursesStatsResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CourseGrpcController.GetCoursesStats",
        async (span) => {
          this._logger.log(`gRPC: Fetching overall courses stats`, {
            ctx: CourseGrpcController.name,
          });

          const stats = await this._getCoursesStatsUseCase.execute();

          return {
            success: stats,
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to fetch courses stats: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetInstructorCourseRatingStats")
  async getInstructorCourseRatingStats(
    data: GetInstructorCourseRatingStatsRequest,
    _metadata: Metadata,
  ): Promise<GetInstructorCourseRatingStatsResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "EnrollmentGrpcController.GetInstructorCourseRatingStats",
        async (span) => {
          span.setAttribute("course.id", data.courseId);

          this._logger.log(
            `gRPC: Fetching rating stats for course ${data.courseId}`,
            { ctx: CourseGrpcController.name },
          );

          const stats =
            await this._getInstructorCourseRatingStatsUseCase.execute(data);

          return { success: stats };
        },
      );
    } catch (error: any) {
      this._logger.error(
        `Failed to get instructor course rating stats: ${error.message}`,
        { error },
      );

      throw error;
    }
  }
}
