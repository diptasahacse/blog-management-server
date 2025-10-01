import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class EmailNotificationDto {
  @IsEmail()
  to: string;

  @IsNotEmpty()
  subject: string;

  @IsNotEmpty()
  template: string;

  @IsOptional()
  context?: Record<string, string | number>;
}
