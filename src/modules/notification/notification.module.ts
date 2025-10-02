import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { NotificationService } from './notification.service';
import { EmailProvider } from './channels/email/email.provider';
import { SmsProvider } from './channels/sms.provider';
import { WhatsAppProvider } from './channels/whatsapp.provider';
import { AppProvider } from './channels/app.provider';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      defaults: {
        from: 'System Notification',
      },
      template: {
        dir: join(
          process.cwd(),
          'src/modules/notification/channels/email/templates',
        ),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [
    NotificationService,
    EmailProvider,
    SmsProvider,
    WhatsAppProvider,
    AppProvider,
  ],
  exports: [NotificationService], // অন্য module এ use করার জন্য
})
export class NotificationModule {}
