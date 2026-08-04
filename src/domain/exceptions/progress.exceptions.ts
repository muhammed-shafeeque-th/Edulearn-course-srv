import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

// Progress Domain Exceptions

export class ProgressNotFoundException extends DomainException {
  errorCode = "_EXCEPTION";
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || "Progress not found.",
      "PROGRESS_NOT_FOUND",
    );
  }
}

export class ProgressEntryAlreadyExistException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.ALREADY_EXISTS,
      message || "Progress entry already exists.",
      "PROGRESS_ENTRY_ALREADY_EXISTS",
    );
  }
}

export class ProgressDomainException extends DomainException {
  errorCode = "";
  constructor(message?: string) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      message || "A progress domain exception occurred.",
      "PROGRESS_DOMAIN_EXCEPTION",
    );
  }
}
