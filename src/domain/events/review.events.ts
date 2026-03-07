import { CourseStatus } from "../entities/course.entity";
import { BaseEvent } from "./base.event";






export interface CourseReviewSubmittedEvent extends BaseEvent<{
    userId: string;
    courseId: string;
    enrollmentId: string;
    reviewId: string;
    rating: number;
    comment: string;
    reviewedAt: string;
}> { }

