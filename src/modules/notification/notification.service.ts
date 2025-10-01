import { Injectable, BadRequestException } from '@nestjs/common';

import { SmsProvider } from './channels/sms.provider';
import { EmailProvider } from './channels/email/email.provider';
import { WhatsAppProvider } from './channels/whatsapp.provider';
import { SendNotificationDto } from './dto/send-notification.dto';
import { AppProvider } from './channels/app.provider';
import { NotificationChannelEnum } from './enum/notification-channel.enum';

@Injectable()
export class NotificationService {
  constructor(
    private smsProvider: SmsProvider,
    private emailProvider: EmailProvider,
    private whatsAppProvider: WhatsAppProvider,
    private inAppProvider: AppProvider,
  ) {}

  async sendNotification(dto: SendNotificationDto): Promise<void> {
    switch (dto.channel) {
      //   case NotificationChannelEnum.SMS:
      //     return await this.smsProvider.send(dto.recipient, dto.message);

      case NotificationChannelEnum.EMAIL:
        if (!dto.email) {
          throw new BadRequestException('Email notification is required');
        }
        console.log(dto);
        return await this.emailProvider.send(dto.email);

      //   case NotificationChannelEnum.WHATSAPP:
      //     return await this.whatsAppProvider.send(dto.recipient, dto.message);

      //   case NotificationChannelEnum.IN_APP:
      //     return await this.inAppProvider.send(dto.recipient, dto.message);

      default:
        throw new BadRequestException('Unsupported notification channel');
    }
  }
}
