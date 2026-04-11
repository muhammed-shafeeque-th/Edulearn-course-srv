import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

// Lesson Domain Exceptions
export class LessonDomainException extends DomainException {
  errorCode = "";
  constructor(message?: string) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      message || "A lesson domain error occurred.",
      "LESSON_DOMAIN_EXCEPTION",
    );
  }
}

export class LessonNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || "The requested lesson was not found.",
      "LESSON_NOT_FOUND",
    );
  }
}
