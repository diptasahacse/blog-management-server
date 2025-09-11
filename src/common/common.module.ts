import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { DiscordNotificationService } from './services/discord-notification.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

@Global()
@Module({
  providers: [LoggerService, DiscordNotificationService, AllExceptionsFilter],
  exports: [LoggerService, DiscordNotificationService, AllExceptionsFilter],
})
export class CommonModule {}
