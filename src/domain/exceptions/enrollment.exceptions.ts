import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

// Enrollment Domain Exceptions

export class EnrollmentNotFoundException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message || "The enrollment was not found.", 'ENROLLMENT_NOT_FOUND');
  }
}

export class AlreadyEnrolledException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.ALREADY_EXISTS, message || "User is already enrolled.", 'ALREADY_ENROLLED');
  }
}

export class EnrollmentDomainException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message || "An enrollment domain error occurred.", 'ENROLLMENT_DOMAIN');
  }
}
