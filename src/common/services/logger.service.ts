import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { IErrorResponse } from '../types/common';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  log(message: any, context?: string) {
    this.writeLog('LOG', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.writeLog('ERROR', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.writeLog('WARN', message, context);
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('DEBUG', message, context);
    }
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('VERBOSE', message, context);
    }
  }

  logError(
    error: IErrorResponse,
    originalError: Error,
    logContext: LogContext = {},
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      statusCode: error.statusCode,
      message: error.message,
      error: error.error,
      correlationId: error.correlationId,
      path: error.path,
      context: logContext,
      originalErrorMessage: originalError.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: originalError.stack,
        errors: error.errors,
      }),
    };

    console.error(JSON.stringify(logEntry, null, 2));
  }

  private writeLog(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context,
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      ...(trace && { trace }),
    };

    console.log(JSON.stringify(logEntry, null, 2));
  }
}
