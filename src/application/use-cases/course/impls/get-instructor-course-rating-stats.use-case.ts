import { Injectable } from "@nestjs/common";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import {
  GetInstructorCourseRatingStatsRequest,
  InstructorCourseRatingStats,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { IGetInstructorCourseRatingStatsUseCase } from "../interfaces/get-instructor-course-rating-stats.interface";

@Injectable()
export class GetInstructorCourseRatingStatsUseCase implements IGetInstructorCourseRatingStatsUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _reviewRepository: IReviewRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: GetInstructorCourseRatingStatsRequest,
  ): Promise<InstructorCourseRatingStats> {
    return this._tracer.startActiveSpan(
      "GetInstructorCourseRatingStatsUseCase.execute",
      async (span) => {
        try {
          this._logger.debug(
            `[GetInstructorCourseRatingStatsUseCase] Fetching rating stats for courseId: ${dto.courseId}, instructorId: ${dto.instructorId}`,
          );

          const [stats, ratingBreakDown] = await Promise.all([
            this._courseRepository.getInstructorCourseRatingStats(
              dto.instructorId,
              dto.courseId,
            ),
            this._reviewRepository.getCourseRatingsBreakdown(dto.courseId),
          ]);

          if (!stats) {
            this._logger.warn(
              `[GetInstructorCourseRatingStatsUseCase] No rating stats found for courseId: ${dto.courseId}, instructorId: ${dto.instructorId}`,
            );
            throw new CourseNotFoundException(
              `Course with id ${dto.courseId} for instructor ${dto.instructorId} is not found`,
            );
          }

          // Compose the response as expected by the proto definition
          const response: InstructorCourseRatingStats = {
            averageRating: stats.averageRating ?? 0,
            totalRatings: stats.totalRatings ?? 0,
            breakdown: {
              _1: ratingBreakDown[1],
              _2: ratingBreakDown[2],
              _3: ratingBreakDown[3],
              _4: ratingBreakDown[4],
              _5: ratingBreakDown[5],
            } as any,
          };

          return response;
        } catch (error: any) {
          span?.setAttribute("error", true);
          this._logger.error(
            `[GetInstructorCourseRatingStatsUseCase] Failed to fetch rating stats for courseId: ${dto.courseId}, instructorId: ${dto.instructorId}. Reason: ${error?.message}`,
            { error },
          );
          throw error;
        }
      },
    );
  }
}
