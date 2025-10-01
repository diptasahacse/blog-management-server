import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailNotificationDto } from '../../dto/email-notification.dto';

@Injectable()
export class EmailProvider {
  constructor(private readonly mailerService: MailerService) {}
  async send(dto: EmailNotificationDto) {
    await this.mailerService.sendMail({
      to: dto.to,
      subject: dto.subject,
      template: dto.template,
      context: dto.context,
    });
  }
}
