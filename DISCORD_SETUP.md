# Discord Error Notifications Setup Guide

This guide will help you set up Discord webhooks to receive real-time error notifications from your NestJS application.

## Prerequisites

- A Discord server where you have administrative permissions
- The application already has the Discord notification service integrated

## Step 1: Create a Discord Webhook

1. **Open Discord and navigate to your server**
2. **Right-click on the channel** where you want to receive error notifications
3. **Select "Edit Channel"**
4. **Go to "Integrations" tab**
5. **Click "Create Webhook"**
6. **Configure the webhook:**
   - Name: `Blog API Errors` (or any name you prefer)
   - Channel: Select the appropriate channel
   - Copy the **Webhook URL**

## Step 2: Configure Environment Variables

Add the following variables to your `.env` file:

```bash
# Discord webhook URL (replace with your actual webhook URL)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN

# Enable Discord notifications
DISCORD_NOTIFICATIONS_ENABLED=true

# Environment (affects notification details)
NODE_ENV=development
```

## Step 3: Test the Integration

### Method 1: Using the Test Endpoint
```bash
# Send a test Discord notification
curl -X POST http://localhost:3000/test-discord

# Trigger a test internal server error
curl http://localhost:3000/test-error

# Trigger a test business logic error
curl http://localhost:3000/test-business-error
```

### Method 2: Using Your Application
Simply trigger any 500-level error in your application, and you should receive a Discord notification.

## Notification Features

### Error Notifications Include:
- **Status Code** and **Error Type**
- **Request Path** and **HTTP Method**
- **Correlation ID** for tracking
- **IP Address** and **User Agent**
- **Error Details** and **Stack Trace** (in development)
- **Timestamp** and **Environment Info**

### Notification Types:
- 🚨 **Critical Alerts** (Red) - 5xx server errors
- ⚠️ **Warnings** (Orange) - 4xx client errors
- ✅ **Test Messages** (Green) - System health checks

## Color Coding
- **Red (0xff0000)**: Internal server errors (5xx)
- **Orange (0xff9900)**: Client errors (4xx)
- **Green (0x00ff00)**: Success/test messages

## Security Considerations

1. **Keep webhook URLs secret** - Never commit them to version control
2. **Use environment variables** - Store sensitive data in `.env` files
3. **Limit webhook permissions** - Only give access to necessary channels
4. **Monitor webhook usage** - Discord has rate limits

## Troubleshooting

### Common Issues:

1. **Notifications not appearing:**
   - Check that `DISCORD_NOTIFICATIONS_ENABLED=true`
   - Verify the webhook URL is correct
   - Ensure the Discord channel exists and the webhook is active

2. **Webhook URL errors:**
   - Make sure the URL format is correct
   - Check that the webhook hasn't been deleted from Discord
   - Verify you have the complete URL including the token

3. **Rate limiting:**
   - Discord webhooks have rate limits (30 requests per minute)
   - The service automatically handles failures gracefully

### Testing Webhook Manually:
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test message from Blog API",
    "username": "Blog API Monitor"
  }'
```

## Advanced Configuration

### Custom Error Filters
You can modify the `DiscordNotificationService` to:
- Filter errors by status code
- Add custom fields to notifications
- Implement different notification channels for different error types

### Production Considerations
- Set `NODE_ENV=production` to exclude stack traces from notifications
- Consider using separate webhooks for different environments
- Implement error aggregation to prevent spam

## Example Discord Message

When an error occurs, you'll receive a message like:

```
💥 Internal Server Error
Database connection failed

Status Code: 500
Path: /api/users
Method: POST
Correlation ID: 1726139445123-abc123def
IP Address: 192.168.1.100
User Agent: Mozilla/5.0...

Error Details:
database: Connection timeout after 30 seconds

Environment: development
```

This setup ensures you're immediately notified of any critical issues in your application!
