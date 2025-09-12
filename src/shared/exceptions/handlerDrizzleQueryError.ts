import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import { IErrorResponse, IErrorItem } from '../types/common';
import { ErrorCodes } from '../enums/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

interface DrizzleErrorMapping {
  statusCode: number;
  message: string;
  errorCode: string;
}

const PG_ERROR_MAPPINGS: Record<string, DrizzleErrorMapping> = {
  '23505': {
    statusCode: HttpStatus.CONFLICT,
    message: 'Resource already exists',
    errorCode: ErrorCodes.DUPLICATE_ENTRY,
  },
  '23503': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Referenced resource does not exist',
    errorCode: ErrorCodes.FOREIGN_KEY_VIOLATION,
  },
  '23502': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Required field cannot be null',
    errorCode: ErrorCodes.NOT_NULL_VIOLATION,
  },
  '08000': {
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'Database connection error',
    errorCode: ErrorCodes.DATABASE_CONNECTION_ERROR,
  },
};

const handlerDrizzleQueryError = (
  exception: DrizzleQueryError,
  path: string = '',
  correlationId?: string,
): { statusCode: number; errorResponse: IErrorResponse } => {
  const pgError = exception.cause as DatabaseError | undefined;
  const code = pgError?.code;

  const mapping = PG_ERROR_MAPPINGS[code || ''] || {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Database operation failed',
    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
  };

  // Extract more specific information from the error
  let specificMessage = mapping.message;
  const errors: IErrorItem[] = [];

  if (code === '23505' && pgError?.detail) {
    // Extract field name from duplicate key error detail
    const keyMatch = pgError.detail.match(/Key \(([^)]+)\)/);
    if (keyMatch) {
      const field = keyMatch[1];
      specificMessage = `${field} already exists`;
      errors.push({
        path: field,
        message: `Duplicate value for ${field}`,
        code: mapping.errorCode,
      });
    }
  } else if (code === '23503' && pgError?.detail) {
    // Extract foreign key constraint information
    const constraintMatch = pgError.detail.match(/Key \(([^)]+)\)/);
    if (constraintMatch) {
      const field = constraintMatch[1];
      errors.push({
        path: field,
        message: `Referenced ${field} does not exist`,
        code: mapping.errorCode,
      });
    }
  } else if (code === '23502' && pgError?.column) {
    // Not null violation
    errors.push({
      path: pgError.column,
      message: `${pgError.column} is required`,
      code: mapping.errorCode,
    });
  }

  // If no specific errors were extracted, add a general error
  if (errors.length === 0) {
    errors.push({
      path: 'database',
      message: specificMessage,
      code: mapping.errorCode,
    });
  }

  const errorResponse: IErrorResponse = {
    statusCode: mapping.statusCode,
    message: specificMessage,
    error: getHttpStatusText(mapping.statusCode),
    errors,
    timestamp: new Date().toISOString(),
    path,
    ...(correlationId && { correlationId }),
  };

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = exception.stack;
  }

  return {
    statusCode: mapping.statusCode,
    errorResponse,
  };
};

function getHttpStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };
  return statusTexts[statusCode] || 'Unknown Error';
}

export default handlerDrizzleQueryError;
