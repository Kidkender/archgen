export class AppException extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: Record<string, any>;

  constructor(
    errorCode: string,
    message?: string,
    statusCode: number = 400,
    details: Record<string, any> = {}
  ) {
    super(message || errorCode);
    this.name = 'AppException';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      error_code: this.errorCode,
      message: this.message,
      details: this.details,
    };
  }
}

export class NotFoundException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 404, details);
    this.name = 'NotFoundException';
  }
}

export class BadRequestException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 400, details);
    this.name = 'BadRequestException';
  }
}

export class UnauthorizedException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 401, details);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 403, details);
    this.name = 'ForbiddenException';
  }
}

export class ConflictException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 409, details);
    this.name = 'ConflictException';
  }
}

export class TooManyRequestsException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 429, details);
    this.name = 'TooManyRequestsException';
  }
}

export class InternalServerException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 500, details);
    this.name = 'InternalServerException';
  }
}

export class ServiceUnavailableException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 503, details);
    this.name = 'ServiceUnavailableException';
  }
}

export class BadGatewayException extends AppException {
  constructor(errorCode: string, message?: string, details?: Record<string, any>) {
    super(errorCode, message, 502, details);
    this.name = 'BadGatewayException';
  }
}
