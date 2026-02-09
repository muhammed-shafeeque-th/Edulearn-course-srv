import { CourseStatus } from "../entities/course.entity";
import { BaseEvent } from "./base.event";

export interface CourseCreatedEvent extends BaseEvent<{
    courseId: string;
    title: string;
    slug: string;
    instructorId: string;
    status: CourseStatus;
    createdAt: string;
}> { }
export interface CourseUpdatedEvent extends BaseEvent<{
    courseId: string;
    title: string;
    slug: string;
    instructorId: string;
    status: CourseStatus;
    updatedAt: string;
}> { }


export interface CoursePublishedEvent extends BaseEvent<{
    courseId: string;
    title: string;
    slug: string;
    instructorId: string;
    status: CourseStatus;
    updatedAt: string;
}> { }

export interface CourseUnPublishedEvent extends BaseEvent<{
    courseId: string;
    title: string;
    slug: string;
    instructorId: string;
    status: CourseStatus;
    updatedAt: string;
}> { }

export interface CourseDeletedEvent extends BaseEvent<{
    courseId: string;
    title: string;
    slug: string;
    instructorId: string;
    status: CourseStatus;
    updatedAt: string;
}> { }