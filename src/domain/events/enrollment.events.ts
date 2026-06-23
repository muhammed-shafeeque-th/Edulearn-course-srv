import { BaseEvent } from "./base.event";

export interface EnrollmentCreatedEvent extends BaseEvent<{
    enrollmentId: string;
    courseId: string;
    instructorId: string;
    studentId: string;
    orderPrice: number;
    orderId: string;
    enrolledAt: string;
    timestamp: number;
}> { }