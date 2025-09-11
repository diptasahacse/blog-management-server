import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
// import { DrizzleQueryError } from 'drizzle-orm';
import { Response } from 'express';
import { IErrorItem, IErrorResponse } from 'src/types/common';
// import handlerDrizzleQueryError from './errors/handlerDrizzleQueryError';
import dotenv from 'dotenv';
dotenv.config();

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let stack = (exception as Error).stack;
    let errors: IErrorItem[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else {
        const r = res as IErrorResponse;

        if (Array.isArray(r.errors)) {
          errors = r.errors;
        }
      }
    }

    // if (exception instanceof DrizzleQueryError) {
    //   const errorData = handlerDrizzleQueryError(exception);
    //   status = HttpStatus.CONFLICT;
    //   message = errorData.message;
    //   errors = errorData.errors;
    //   if (errorData.stack) {
    //     stack = errorData.stack;
    //   }
    // }
    const errorResponse: IErrorResponse = {
      message,
      errors,
    };
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = stack || (exception as Error).stack;
    }

    response.status(status).json(errorResponse);
  }
}
