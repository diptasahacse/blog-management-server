import { HttpException, HttpStatus } from '@nestjs/common';
import { IErrorItem } from '../types/common';
import { ErrorCodes } from '../enums/error-codes.enum';

export class BusinessLogicException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    errors?: IErrorItem[],
    errorCode?: ErrorCodes,
  ) {
    super(
      {
        message,
        errors: errors || [
          {
            path: 'business',
            message,
            code: errorCode || ErrorCodes.INVALID_INPUT,
          },
        ],
      },
      statusCode,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(
      {
        message,
        errors: [
          {
            path: resource.toLowerCase(),
            message,
            code: ErrorCodes.RESOURCE_NOT_FOUND,
          },
        ],
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field: string, value: string) {
    const message = `${resource} with ${field} '${value}' already exists`;

    super(
      {
        message,
        errors: [
          {
            path: field,
            message,
            code: ErrorCodes.DUPLICATE_ENTRY,
          },
        ],
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(errors: IErrorItem[]) {
    super(
      {
        message: 'Validation failed',
        errors,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized access') {
    super(
      {
        message,
        errors: [
          {
            path: 'authorization',
            message,
            code: ErrorCodes.UNAUTHORIZED_ACCESS,
          },
        ],
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden operation') {
    super(
      {
        message,
        errors: [
          {
            path: 'authorization',
            message,
            code: ErrorCodes.FORBIDDEN_OPERATION,
          },
        ],
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
