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

