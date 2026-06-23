import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { CreateCourseUseCase } from "src/application/use-cases/course/create-course.use-case";

import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { UpdateCourseUseCase } from "src/application/use-cases/course/update-course.use-case";
import { UpdateCourseRequestDto } from "./dtos/course/update-course-request.dto";
import { GetCourseRequestDto } from "./dtos/course/get-course.dto";
import { CreateCourseRequestDto } from "./dtos/course/create-course.dto";
import { DeleteCourseRequestDto } from "./dtos/course/delete-course.dto";
import { DeleteCourseUseCase } from "src/application/use-cases/course/delete-course.use-case";
import { GetCoursesByInstructorRequestDto } from "./dtos/course/get-course-by-instructor.dto";
import { GetCoursesByInstructorUseCase } from "src/application/use-cases/course/get-courses-by-instructor.use-case";
import { GetCoursesRequestDto } from "./dtos/course/get-courses-params.dto";
import { GetCourseUseCase } from "src/application/use-cases/course/get-course.use-case";
import { GetEnrolledCoursesUseCase } from "src/application/use-cases/course/get-enrolled-courses.use-case";
import { ListCoursesUseCase } from "src/application/use-cases/course/list-courses.use-case";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { GetCourseBySlugRequestDto } from "./dtos/course/get-course-by-slug.dto";
import { GetCourseBySlugUseCase } from "src/application/use-cases/course/get-course-by-slug.use-case";
import { GetCoursesByIdsUseCase } from "src/application/use-cases/course/get-course-by-ids.use-case";
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
import { UnPublishCourseUseCase } from "src/application/use-cases/course/unpublish-course.use-case";
import { PublishCourseUseCase } from "src/application/use-cases/course/publish-course.use-case";
import { GetCoursesStatsResponse, GetInstructorCourseRatingStatsRequest, GetInstructorCourseRatingStatsResponse, GetInstructorCoursesStatsRequest, GetInstructorCoursesStatsResponse } from "src/infrastructure/grpc/generated/course/types/stats";
import { GetInstructorCoursesStatsUseCase } from "src/application/use-cases/course/get-instructor-courses-stats.use-case";
import { GetCoursesStatsUseCase } from "src/application/use-cases/course/get-courses-stats.use-case";
import { GetInstructorCourseRatingStatsUseCase } from "src/application/use-cases/course/get-instructor-course-rating-stats.use-case";

@Controller()
export class CourseGrpcController {
  constructor(
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly getCourseUseCase: GetCourseUseCase,
    private readonly getCourseBySlugUseCase: GetCourseBySlugUseCase,
    private readonly listCoursesUseCase: ListCoursesUseCase,
    private readonly getCoursesByIdsUseCase: GetCoursesByIdsUseCase,
    private readonly updateCourseUseCase: UpdateCourseUseCase,
    private readonly deleteCourseUseCase: DeleteCourseUseCase,
    private readonly publishCourseUseCase: PublishCourseUseCase,
    private readonly unPublishCourseUseCase: UnPublishCourseUseCase,
    private readonly getCoursesByInstructorUseCase: GetCoursesByInstructorUseCase,
    private readonly getEnrolledCoursesUseCase: GetEnrolledCoursesUseCase,
    private readonly getInstructorCoursesStatsUseCase: GetInstructorCoursesStatsUseCase,
    private readonly getInstructorCourseRatingStatsUseCase: GetInstructorCourseRatingStatsUseCase,
    private readonly getCoursesStatsUseCase: GetCoursesStatsUseCase,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
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
    metadata: Metadata
  ): Promise<CourseResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.CreateCourse",
        async (span) => {
          span.setAttribute("course.title", data.title);
          span.setAttribute("course.instructor.id", data.instructorId);

          this.logger.info(`gRPC: Creating course: ${data.title}`, {
            ctx: CourseGrpcController.name,
          });

          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const courseDto = await this.createCourseUseCase.execute(
            data,
            idempotencyKey
          );

          return {
            course: courseDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to create course: ${error.message}`, {
        error,
      });
      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetCourse")
  async getCourse(
    data: GetCourseRequestDto,
    metadata: Metadata
  ): Promise<CourseResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.GetCourse",
        async (span) => {
          this.logger.info(`gRPC: Fetching course: ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });
          span.setAttribute("course.id", data.courseId);
          const courseDto = await this.getCourseUseCase.execute(data.courseId);

          return {
            course: courseDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get course: ${error.message}`, {
        error,
      });
      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetCourseBySlug")
  async getCourseBySlug(
    data: GetCourseBySlugRequestDto,
    metadata: Metadata
  ): Promise<CourseResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.GetCourseBySlug",
        async (span) => {
          this.logger.info(`gRPC: Fetching course: ${data.slug}`, {
            ctx: CourseGrpcController.name,
          });
          span.setAttribute("course.slug", data.slug);
          const courseDto = await this.getCourseBySlugUseCase.execute(
            data.slug
          );

          return {
            course: courseDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get course: ${error.message}`, {
        error,
      });
      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("CourseService", "getCourses")
  async getCourses(
    data: GetCoursesRequestDto,
    metadata: Metadata
  ): Promise<CoursesListResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.GetCourse",
        async (span) => {
          this.logger.info(
            `gRPC: Fetching courses page: ${data.params?.pagination.page} pageSize: ${data.params?.pagination?.pageSize} }`,
            {
              ctx: CourseGrpcController.name,
            }
          );
          span.setAttribute("course.page", data.params?.pagination?.page);
          span.setAttribute(
            "course.pageSize",
            data.params?.pagination?.pageSize
          );
          span.setAttribute("course.sortBy", data.params?.pagination?.sortBy);
          span.setAttribute(
            "course.sortOrder",
            data.params?.pagination?.sortOrder
          );

          const { courses: courseDtos, total } =
            await this.listCoursesUseCase.execute(data.params);

          return {
            courses: {
              courses: courseDtos?.map((course) => course.toGrpcResponse()),
              total,
            },
          } as CoursesListResponse;
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get all courses: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetCoursesByIds")
  async getCoursesByIds(
    data: GetCourseByIdsRequestDto,
    metadata: Metadata
  ): Promise<GetCoursesByIdsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.GetCourse",
        async (span) => {
          this.logger.info(
            `gRPC: Fetching courses for ${data.courseIds?.length} ids`,
            {
              ctx: CourseGrpcController.name,
            }
          );

          const { courses: courseDtos } =
            await this.getCoursesByIdsUseCase.execute(data);

          return {
            success: {
              courses: {
                courses: courseDtos?.map((course) => course.toGrpcResponse()),
              },
            },
          } as GetCoursesByIdsResponse;
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get all courses: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "UpdateCourse")
  async updateCourse(
    data: UpdateCourseRequestDto,
    metadata: Metadata
  ): Promise<CourseResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.UpdateCourse",
        async (span) => {
          this.logger.log(`gRPC: Updating course ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });
          span.setAttribute("course.id", data.courseId);

          const courseDto = await this.updateCourseUseCase.execute(data);
          return {
            course: courseDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update course: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("CourseService", "DeleteCourse")
  async deleteCourse(
    data: DeleteCourseRequestDto,
    metadata: Metadata
  ): Promise<DeleteCourseResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.DeleteCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this.logger.log(`gRPC: Deleting course ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });

          await this.deleteCourseUseCase.execute(data);
          return { success: { deleted: true } } as DeleteCourseResponse;
        }
      );
    } catch (error) {
      this.logger.error(`Failed to delete course: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "PublishCourse")
  async publishCourse(
    data: PublishCourseRequest,
    metadata: Metadata
  ): Promise<CourseResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.PublishCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this.logger.log(`gRPC: Deleting course ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });

          const result = await this.publishCourseUseCase.execute(
            data
          );
          return { course: result.toGrpcResponse() };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to publish course: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "UnPublishCourse")
  async unPublishCourse(
    data: PublishCourseRequest,
    metadata: Metadata
  ): Promise<CourseResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.UnPublishCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this.logger.log(`gRPC: Deleting course ${data.courseId}`, {
            ctx: CourseGrpcController.name,
          });

          const result = await this.unPublishCourseUseCase.execute(
            data
          );
          return { course: result.toGrpcResponse() };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to un publish course: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetCoursesByInstructor")
  async getCoursesByInstructor(
    data: GetCoursesByInstructorRequestDto,
    metadata: Metadata
  ): Promise<CoursesListResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.GetCoursesByInstructor",
        async (span) => {
          span.setAttribute("course.instructor.id", data.instructorId);
          span.setAttribute("course.page", data.pagination?.page);
          span.setAttribute("course.pageSize", data.pagination?.pageSize);
          span.setAttribute("course.sortBy", data.pagination?.sortBy);
          span.setAttribute("course.sortOrder", data.pagination?.sortOrder);

          this.logger.log(
            `gRPC: Fetching courses for instructor ${data.instructorId}`,
            { ctx: CourseGrpcController.name }
          );
          const { courses: courseDtos, total } =
            await this.getCoursesByInstructorUseCase.execute(
              data.instructorId,
              data.pagination?.page,
              data.pagination?.pageSize,
              data.pagination?.sortBy,
              (data.pagination?.sortOrder as any) || "DESC"
            );
          return {
            courses: {
              courses: courseDtos?.map((course) => course.toGrpcResponse()),
              total,
            },
          } as CoursesListResponse;
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get courses by instructor: ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetInstructorCoursesStats")
  async getInstructorCoursesStats(
    data: GetInstructorCoursesStatsRequest,
    metadata: Metadata
  ): Promise<GetInstructorCoursesStatsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.GetInstructorCoursesStats",
        async (span) => {
          span.setAttribute("course.instructor.id", data.instructorId);

          this.logger.log(
            `gRPC: Fetching instructor's courses stats for ${data.instructorId}`,
            { ctx: CourseGrpcController.name }
          );

          const stats = await this.getInstructorCoursesStatsUseCase.execute(data);

          return {
            success: stats,
          };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get instructor courses stats: ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetCoursesStats")
  async getCoursesStats(
    _data: Empty,
    _metadata: Metadata
  ): Promise<GetCoursesStatsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CourseGrpcController.GetCoursesStats",
        async (span) => {
          this.logger.log(`gRPC: Fetching overall courses stats`, {
            ctx: CourseGrpcController.name,
          });

          const stats = await this.getCoursesStatsUseCase.execute();

          return {
            success: stats,
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to fetch courses stats: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetInstructorCourseRatingStats")
  async getInstructorCourseRatingStats(
    data: GetInstructorCourseRatingStatsRequest,
    _metadata: Metadata
  ): Promise<GetInstructorCourseRatingStatsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetInstructorCourseRatingStats",
        async (span) => {
          span.setAttribute("course.id", data.courseId);

          this.logger.log(
            `gRPC: Fetching rating stats for course ${data.courseId}`,
            { ctx: CourseGrpcController.name }
          );

          const stats = await this.getInstructorCourseRatingStatsUseCase.execute(data);

          return { success: stats };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get instructor course rating stats: ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return { error: this.createErrorResponse(error) };
      }
      throw error;
    }
  }

}
