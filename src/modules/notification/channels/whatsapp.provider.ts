import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsAppProvider {
  send(recipient: string, message: string) {
    // WhatsApp API integration (e.g. Twilio, Meta API)
    console.log(`💬 WhatsApp sent to ${recipient}: ${message}`);
  }
}
