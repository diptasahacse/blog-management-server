import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsProvider {
  send(recipient: string, message: string) {
    console.log(`📱 SMS sent to ${recipient}: ${message}`);
  }
}
