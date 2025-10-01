import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { NotificationChannelEnum } from '../enum/notification-channel.enum';
import { EmailNotificationDto } from './email-notification.dto';
import { Type } from 'class-transformer';

export class SendNotificationDto {
  @IsEnum(NotificationChannelEnum)
  channel: NotificationChannelEnum;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmailNotificationDto)
  email?: EmailNotificationDto;
}
