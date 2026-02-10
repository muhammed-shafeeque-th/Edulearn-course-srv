import { status as GrpcStatus, ServiceError } from "@grpc/grpc-js";

import { Metadata } from "@grpc/grpc-js";

function toGrpcError(message: string, code: GrpcStatus, errorCode: string): ServiceError {
  const metadata = new Metadata();
  metadata.set("error_code", errorCode);
  metadata.set("detail", message);

  const error: ServiceError = {
    name: "GrpcError",
    message,
    code,
    details: message,
    metadata,
  };
  return error;
}

export abstract class DomainException extends Error {
  abstract errorCode: string;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
  abstract serializeGrpcError(): ServiceError;
}

// ================= Course Domain Exceptions =================
export class CourseNotFoundException extends DomainException {
  errorCode = "COURSE_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "The requested course was not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}

export class CourseAlreadyExistException extends DomainException {
  errorCode = "COURSE_ALREADY_EXISTS_EXCEPTION";
  constructor(title: string) {
    super(`Course with title "${title}" already exists.`);
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.ALREADY_EXISTS, this.errorCode);
  }
}

export class CourseDomainException extends DomainException {
  errorCode = "COURSE_DOMAIN_EXCEPTION";
  constructor(message?: string) {
    super(message || "A course domain error occurred.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}

// ================= Section Domain Exceptions =================

export class SectionDomainException extends DomainException {
  errorCode = "SECTION_DOMAIN_EXCEPTION";
  constructor(message?: string) {
    super(message || "A section domain error occurred.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}

export class SectionNotFoundException extends DomainException {
  errorCode = "SECTION_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "The requested section was not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}

// ================= Lesson Domain Exceptions =================

export class LessonDomainException extends DomainException {
  errorCode = "LESSON_DOMAIN_EXCEPTION";
  constructor(message?: string) {
    super(message || "A lesson domain error occurred.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}

export class LessonNotFoundException extends DomainException {
  errorCode = "LESSON_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "The requested lesson was not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}

// ================= Enrollment Domain Exceptions =================

export class EnrollmentNotFoundException extends DomainException {
  errorCode = "ENROLLMENT_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "The enrollment was not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}

export class AlreadyEnrolledException extends DomainException {
  errorCode = "ALREADY_ENROLLED_EXCEPTION";
  constructor(message?: string) {
    super(message || "User is already enrolled.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.ALREADY_EXISTS, this.errorCode);
  }
}

export class EnrollmentDomainException extends DomainException {
  errorCode = "ENROLLMENT_DOMAIN_EXCEPTION";
  constructor(message?: string) {
    super(message || "An enrollment domain error occurred.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}

// ================= Progress Domain Exceptions =================

export class ProgressNotFoundException extends DomainException {
  errorCode = "PROGRESS_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "Progress not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}

export class ProgressEntryAlreadyExistException extends DomainException {
  errorCode = "PROGRESS_ENTRY_ALREADY_EXISTS_EXCEPTION";
  constructor(message?: string) {
    super(message || "Progress entry already exists.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.ALREADY_EXISTS, this.errorCode);
  }
}

export class ProgressDomainException extends DomainException {
  errorCode = "PROGRESS_DOMAIN_EXCEPTION";
  constructor(message?: string) {
    super(message || "A progress domain exception occurred.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}

// ================= General Exceptions =================

export class NotAuthorizedException extends DomainException {
  errorCode = "NOT_AUTHORIZED_EXCEPTION";
  constructor(message?: string) {
    super(message || "User not authorized to perform this operation.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.PERMISSION_DENIED, this.errorCode);
  }
}
export class BadRequestException extends DomainException {
  errorCode = "BAD_REQUEST_EXCEPTION";
  constructor(message?: string) {
    super(message || "Invalid request.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.INVALID_ARGUMENT, this.errorCode);
  }
}
// ================= User Domain Exceptions =================

export class UserDomainException extends DomainException {
  errorCode = "USER_DOMAIN_EXCEPTION";
  constructor(message?: string) {
    super(message || "A user domain error occurred.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}

export class UserNotFoundException extends DomainException {
  errorCode = "USER_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "User not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}

export class UnauthorizedException extends DomainException {
  errorCode = "UNAUTHORIZED_EXCEPTION";
  constructor(message?: string) {
    super(message || "Unauthorized action.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.PERMISSION_DENIED, this.errorCode);
  }
}

// ================= Quiz Domain Exceptions =================

export class QuizDomainException extends DomainException {
  errorCode = "QUIZ_DOMAIN_EXCEPTION";
  constructor(message?: string) {
    super(message || "Quiz domain exception.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}
export class QuizNotFoundException extends DomainException {
  errorCode = "QUIZ_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "Quiz not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}
// ================= Certificate Domain Exceptions =================

export class CertificateDomainException extends DomainException {
  errorCode = "CERTIFICATE_DOMAIN_EXCEPTION";
  constructor(message?: string) {
    super(message || "Certificate domain exception.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}
export class CertificateNotFoundException extends DomainException {
  errorCode = "CERTIFICATE_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "Certificate not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}

// ================= Review Domain Exceptions =================

export class ReviewNotFoundException extends DomainException {
  errorCode = "REVIEW_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || "Review not found.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.NOT_FOUND, this.errorCode);
  }
}

export class AlreadyReviewedException extends DomainException {
  errorCode = "ALREADY_REVIEWED_EXCEPTION";
  constructor(message?: string) {
    super(message || "You have already reviewed this item.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.ALREADY_EXISTS, this.errorCode);
  }
}

export class ReviewException extends DomainException {
  errorCode = "REVIEW_EXCEPTION";
  constructor(message?: string) {
    super(message || "A review exception occurred.");
  }
  serializeGrpcError(): ServiceError {
    return toGrpcError(this.message, GrpcStatus.UNKNOWN, this.errorCode);
  }
}
