import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { DiscordNotificationService } from './common/services/discord-notification.service';
import { BusinessLogicException } from './common/exceptions/custom.exceptions';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly discordNotificationService: DiscordNotificationService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-error')
  testInternalServerError() {
    throw new Error(
      'This is a test internal server error for Discord notifications',
    );
  }

  @Get('test-business-error')
  testBusinessError() {
    throw new BusinessLogicException('This is a test business logic error');
  }

  @Post('test-discord')
  async testDiscordNotification() {
    try {
      await this.discordNotificationService.sendTestMessage();
      return { message: 'Discord test notification sent successfully!' };
    } catch (error) {
      throw new Error(
        'Failed to send Discord test notification: ' + (error as Error).message,
      );
    }
  }
}
