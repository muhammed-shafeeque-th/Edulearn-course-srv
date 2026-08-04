import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

// Module Domain Exceptions

export class ModuleDomainException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      message || "A module domain error occurred.",
      "SECTION_DOMAIN_EXCEPTION",
    );
  }
}

export class ModuleNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || "The requested module was not found.",
    );
  }
}
