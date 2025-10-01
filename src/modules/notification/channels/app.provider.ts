import { Injectable } from '@nestjs/common';

@Injectable()
export class AppProvider {
  send(recipient: string, message: string) {
    // DB তে store করবে -> user যখন app খুলবে তখন দেখাবে
    console.log(`🖥️ In-App notification for ${recipient}: ${message}`);
  }
}
