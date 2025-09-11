import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

@Global()
@Module({
  providers: [LoggerService, AllExceptionsFilter],
  exports: [LoggerService, AllExceptionsFilter],
})
export class CommonModule {}
