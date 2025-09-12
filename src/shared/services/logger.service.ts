import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { IErrorResponse } from '../types/common';
import { DiscordNotificationService } from './discord-notification.service';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    private readonly discordNotificationService: DiscordNotificationService,
  ) {}
  log(message: string, context?: string) {
    this.writeLog('LOG', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.writeLog('ERROR', message, context, trace);
  }

  warn(message: string, context?: string) {
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

    // Send Discord notification for internal server errors (5xx status codes)
    if (error.statusCode >= 500) {
      this.discordNotificationService
        .sendErrorNotification(error, originalError, logContext)
        .catch((discordError) => {
          console.error('Failed to send Discord notification:', discordError);
        });
    }
  }

  private writeLog(
    level: string,
    message: string,
    context?: string,
    trace?: string,
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context,
      message,
      ...(trace && { trace }),
    };

    console.log(JSON.stringify(logEntry, null, 2));
  }
}
