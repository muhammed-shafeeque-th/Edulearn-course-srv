import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

// Course Domain Exceptions
export class CourseNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || "The requested course was not found.",
      "COURSE_NOT_FOUND",
    );
  }
}

export class CourseAlreadyExistException extends DomainException {
  constructor(title: string) {
    super(
      ErrorCode.ALREADY_EXISTS,
      `Course with title "${title}" already exists.`,
      "COURSE_ALREADY_EXISTS",
    );
  }
}

export class CourseDomainException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      message || "A course domain error occurred.",
      "COURSE_DOMAIN_EXCEPTION",
    );
  }
}
