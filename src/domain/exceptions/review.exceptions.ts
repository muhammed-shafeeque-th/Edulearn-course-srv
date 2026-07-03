import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

// Review Domain Exceptions

export class ReviewNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || "Review not found.",
      "REVIEW_NOT_FOUND",
    );
  }
}

export class AlreadyReviewedException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.ALREADY_EXISTS,
      message || "You have already reviewed this item.",
      "USER_ALREADY_REVIEWED",
    );
  }
}

export class ReviewException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      message || "A review exception occurred.",
      "REVIEW_EXCEPTION",
    );
  }
}
