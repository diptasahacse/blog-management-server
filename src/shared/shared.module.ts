import { Module } from '@nestjs/common';
import { LoggerService, DiscordNotificationService } from './services';
import { AllExceptionsFilter } from './filters';

@Module({
  providers: [LoggerService, DiscordNotificationService, AllExceptionsFilter],
  exports: [LoggerService, DiscordNotificationService, AllExceptionsFilter],
})
export class SharedModule {}
