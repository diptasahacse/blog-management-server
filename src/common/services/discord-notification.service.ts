import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IErrorResponse } from '../types/common';
import { LogContext } from './logger.service';
import dotenv from 'dotenv';

dotenv.config();

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  author?: {
    name: string;
    icon_url?: string;
  };
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

@Injectable()
export class DiscordNotificationService {
  private readonly webhookUrl: string;
  private readonly isEnabled: boolean;

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
    this.isEnabled =
      !!this.webhookUrl && process.env.DISCORD_NOTIFICATIONS_ENABLED === 'true';
  }

  async sendErrorNotification(
    error: IErrorResponse,
    originalError: Error,
    logContext: LogContext = {},
  ) {
    if (!this.isEnabled) {
      return;
    }

    try {
      const embed = this.createErrorEmbed(error, originalError, logContext);
      const payload: DiscordWebhookPayload = {
        username: 'Blog API Monitor',
        avatar_url: 'https://cdn.discordapp.com/emojis/823633374022377532.png', // Error emoji
        embeds: [embed],
      };

      await this.sendWebhook(payload);
    } catch (webhookError) {
      console.error('Failed to send Discord notification:', webhookError);
    }
  }

  async sendCriticalAlert(message: string, details?: any) {
    if (!this.isEnabled) {
      return;
    }

    try {
      const embed: DiscordEmbed = {
        title: '🚨 Critical Alert',
        description: message,
        color: 0xff0000, // Red color
        timestamp: new Date().toISOString(),
        fields: details
          ? [
              {
                name: 'Details',
                value: JSON.stringify(details, null, 2).substring(0, 1024),
                inline: false,
              },
            ]
          : undefined,
        footer: {
          text: 'Blog API Monitoring System',
        },
      };

      const payload: DiscordWebhookPayload = {
        username: 'Blog API Monitor',
        embeds: [embed],
      };

      await this.sendWebhook(payload);
    } catch (webhookError) {
      console.error('Failed to send Discord critical alert:', webhookError);
    }
  }

  private createErrorEmbed(
    error: IErrorResponse,
    originalError: Error,
    logContext: LogContext,
  ): DiscordEmbed {
    const isInternalError = error.statusCode >= 500;
    const color = isInternalError ? 0xff0000 : 0xff9900; // Red for 5xx, Orange for 4xx
    const emoji = isInternalError ? '💥' : '⚠️';

    const fields: DiscordEmbedField[] = [
      {
        name: 'Status Code',
        value: error.statusCode.toString(),
        inline: true,
      },
      {
        name: 'Path',
        value: error.path || 'Unknown',
        inline: true,
      },
      {
        name: 'Method',
        value: logContext.method || 'Unknown',
        inline: true,
      },
    ];

    if (error.correlationId) {
      fields.push({
        name: 'Correlation ID',
        value: error.correlationId,
        inline: true,
      });
    }

    if (logContext.ip) {
      fields.push({
        name: 'IP Address',
        value: logContext.ip,
        inline: true,
      });
    }

    if (logContext.userAgent) {
      fields.push({
        name: 'User Agent',
        value: logContext.userAgent.substring(0, 100),
        inline: false,
      });
    }

    if (error.errors && error.errors.length > 0) {
      const errorDetails = error.errors
        .map((err) => `**${err.path}**: ${err.message}`)
        .join('\n')
        .substring(0, 1024);

      fields.push({
        name: 'Error Details',
        value: errorDetails,
        inline: false,
      });
    }

    // Add stack trace for internal errors in development
    if (
      isInternalError &&
      process.env.NODE_ENV === 'development' &&
      originalError.stack
    ) {
      fields.push({
        name: 'Stack Trace',
        value: `\`\`\`\n${originalError.stack.substring(0, 800)}\n\`\`\``,
        inline: false,
      });
    }

    return {
      title: `${emoji} ${error.error}`,
      description: error.message,
      color,
      fields,
      timestamp: error.timestamp,
      footer: {
        text: `Environment: ${process.env.NODE_ENV || 'unknown'}`,
      },
      author: {
        name: 'Blog API Error Monitor',
        icon_url: 'https://cdn.discordapp.com/emojis/823633374022377532.png',
      },
    };
  }

  private async sendWebhook(payload: DiscordWebhookPayload) {
    if (!this.webhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    await axios.post(this.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    });
  }

  // Test method to verify Discord integration
  async sendTestMessage() {
    if (!this.isEnabled) {
      throw new Error('Discord notifications are not enabled');
    }

    const embed: DiscordEmbed = {
      title: '✅ Test Notification',
      description: 'Discord integration is working correctly!',
      color: 0x00ff00, // Green color
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'Environment',
          value: process.env.NODE_ENV || 'unknown',
          inline: true,
        },
        {
          name: 'Timestamp',
          value: new Date().toLocaleString(),
          inline: true,
        },
      ],
      footer: {
        text: 'Blog API Monitoring System',
      },
    };

    const payload: DiscordWebhookPayload = {
      username: 'Blog API Monitor',
      embeds: [embed],
    };

    await this.sendWebhook(payload);
  }
}
