import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

// Quiz Domain Exceptions

export class QuizDomainException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      message || "Quiz domain exception.",
      "QUIZ_DOMAIN_EXCEPTION",
    );
  }
}
export class QuizNotFoundException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message || "Quiz not found.", "QUIZ_NOT_FOUND");
  }
}
