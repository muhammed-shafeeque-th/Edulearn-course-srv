import {
  GetEnrollmentTrendRequest,
  EnrollmentTrendStats,
} from "src/infrastructure/grpc/generated/course/types/stats";

export abstract class IGetEnrollmentTrendUseCase {
  /**
   * Executes the use case to get enrollment trend for a specific year.
   * @param data - The request containing the year.
   * @returns The enrollment trend stats or null if not found.
   */
  abstract execute(
    data: GetEnrollmentTrendRequest,
  ): Promise<EnrollmentTrendStats | null>;
}
