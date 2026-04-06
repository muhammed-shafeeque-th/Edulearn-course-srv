import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

// Category Domain Exceptions
export class CategoryDomainException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message || "A category domain error occurred.", 'CATEGORY_DOMAIN_EXCEPTION');
  }
}

export class CategoryAlreadyExistException extends DomainException {
  constructor(title: string) {
    super(ErrorCode.ALREADY_EXISTS, `Category with title "${title}" already exists.`, 'CATEGORY_ALREADY_EXISTS');
  }
}

export class CategoryNotFoundException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message || "The requested category was not found.", 'CATEGORY_NOT_FOUND');
  }
}
