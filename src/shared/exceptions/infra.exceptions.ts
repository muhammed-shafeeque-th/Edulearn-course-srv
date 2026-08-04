import { BaseException } from "./base-exception";
import { ErrorCode } from "./error-codes";

export class NotAuthorizedException extends BaseException {
  errorCode = "_EXCEPTION";
  constructor(message?: string) {
    super(
      ErrorCode.PERMISSION_DENIED,
      message || "You don't have permission to perform this operation.",
      "NOT_AUTHORIZED",
    );
  }
}

export class ClientServiceException extends BaseException {
  constructor(message?: string) {
    super(
      ErrorCode.FAILED_PRECONDITION,
      message || `Something went wrong while executing the client request`,
      "CLIENT_SERVICE_EXCEPTION",
    );
  }
}
export class BadRequestException extends BaseException {
  constructor(message?: string) {
    super(
      ErrorCode.INVALID_ARGUMENT,
      message || `Invalid request parameters`,
      "INVALID_REQUEST_ARGUMENTS",
    );
  }
}

export class TimeoutException extends BaseException {
  constructor(message?: string) {
    super(
      ErrorCode.DEADLINE_EXCEEDED,
      message || `Timeout exception`,
      "REQUEST_TIMEOUT",
    );
  }
}

// User Domain Exceptions

export class UserDomainException extends BaseException {
  errorCode = "";
  constructor(message?: string) {
    super(
      ErrorCode.FAILED_PRECONDITION,
      message || "A user domain error occurred.",
      "USER_DOMAIN_EXCEPTION",
    );
  }
}

export class UserNotFoundException extends BaseException {
  errorCode = "_EXCEPTION";
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message || "User not found.", "USER_NOT_FOUND");
  }
}

export class UnauthorizedException extends BaseException {
  errorCode = "UNAUTHORIZED_EXCEPTION";
  constructor(message?: string) {
    super(
      ErrorCode.PERMISSION_DENIED,
      message || "User not authorized to perform this operation.",
      "NOT_AUTHORIZED",
    );
  }
}
