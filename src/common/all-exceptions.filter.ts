import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { DrizzleQueryError } from 'drizzle-orm';
import { Request, Response } from 'express';
import { IErrorItem, IErrorResponse } from 'src/common/types/common';
import handlerDrizzleQueryError from './errors/handlerDrizzleQueryError';
import { LoggerService } from './services/logger.service';
import { CorrelationIdGenerator } from './utils/correlation-id.util';
import { ErrorCodes } from './enums/error-codes.enum';

interface ValidationError {
  property: string;
  value?: unknown;
  constraints?: Record<string, string>;
  message?: string;
}

interface ConflictError {
  property: string;
  value?: unknown;
  message: string;
}

interface HttpExceptionResponse {
  message?: string | string[];
  errors?: ValidationError[] | ConflictError[];
  error?: string;
  statusCode?: number;
}

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate correlation ID for request tracking
    const correlationId = CorrelationIdGenerator.generate();

    // Extract request information for logging
    const requestInfo = {
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip || request.connection.remoteAddress,
      correlationId,
    };

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: IErrorResponse;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      errorResponse = this.handleHttpException(
        exception,
        request.url,
        correlationId,
      );
      statusCode = exception.getStatus();
    } else if (exception instanceof DrizzleQueryError) {
      const drizzleResult = handlerDrizzleQueryError(
        exception,
        request.url,
        correlationId,
      );
      statusCode = drizzleResult.statusCode;
      errorResponse = drizzleResult.errorResponse;
    } else if (exception instanceof Error) {
      errorResponse = this.handleGenericError(
        exception,
        request.url,
        correlationId,
      );
    } else {
      errorResponse = this.handleUnknownError(
        exception,
        request.url,
        correlationId,
      );
    }

    // Log the error with context
    this.logger.logError(errorResponse, exception as Error, requestInfo);

    // Send the error response
    response.status(statusCode).json(errorResponse);
  }

  private handleHttpException(
    exception: HttpException,
    path: string,
    correlationId: string,
  ): IErrorResponse {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message = exception.message;
    let errors: IErrorItem[] = [];

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const errorResponse = response as HttpExceptionResponse;

      // Handle validation errors from class-validator
      if (Array.isArray(errorResponse.message)) {
        message = 'Validation failed';
        errors = errorResponse.message.map((msg: string) => ({
          path: 'validation',
          message: msg,
          code: ErrorCodes.VALIDATION_FAILED,
        }));
      } else if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
        // Check if this is a validation error or conflict error
        const firstError = errorResponse.errors[0];
        if ('constraints' in firstError && firstError.constraints) {
          // This is a validation error
          message = 'Validation failed';
          errors = errorResponse.errors.flatMap((error: ValidationError) => {
            if (error.constraints) {
              return Object.values(error.constraints).map(
                (constraint: string) => ({
                  path: error.property,
                  message: constraint,
                  code: ErrorCodes.VALIDATION_FAILED,
                }),
              );
            }
            return [
              {
                path: error.property || 'validation',
                message: error.message || 'Validation failed',
                code: ErrorCodes.VALIDATION_FAILED,
              },
            ];
          });
        } else {
          // This is likely a conflict error or other custom error
          message = (errorResponse.message as string) || 'Error occurred';
          errors = errorResponse.errors.map((error: ConflictError) => ({
            path: error.property,
            message: error.message,
            code:
              status === 409
                ? ErrorCodes.DUPLICATE_ENTRY
                : ErrorCodes.INVALID_INPUT,
          }));
        }
      } else if (errorResponse.message) {
        message = errorResponse.message;
      }
    }

    const errorResponse: IErrorResponse = {
      statusCode: status,
      message,
      error: this.getHttpStatusText(status),
      timestamp: new Date().toISOString(),
      path,
      correlationId,
    };

    if (errors.length > 0) {
      errorResponse.errors = errors;
    }

    // Include stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = exception.stack;
    }

    return errorResponse;
  }

  private handleGenericError(
    exception: Error,
    path: string,
    correlationId: string,
  ): IErrorResponse {
    const errorResponse: IErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message,
      error: this.getHttpStatusText(HttpStatus.INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
      path,
      correlationId,
      errors: [
        {
          path: 'server',
          message: exception.message,
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
        },
      ],
    };

    // Include stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = exception.stack;
    }

    return errorResponse;
  }

  private handleUnknownError(
    exception: unknown,
    path: string,
    correlationId: string,
  ): IErrorResponse {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: this.getHttpStatusText(HttpStatus.INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
      path,
      correlationId,
      errors: [
        {
          path: 'server',
          message: 'Unknown error type',
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
        },
      ],
    };
  }

  private getHttpStatusText(statusCode: number): string {
    const statusTexts: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    return statusTexts[statusCode] || 'Unknown Error';
  }
}
