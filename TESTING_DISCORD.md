# Testing Discord Error Notifications

Your NestJS server is now running with Discord error notifications integrated! Here's how to test the different scenarios:

## Available Test Endpoints

### 1. Test Discord Integration (No Error)
```bash
curl -X POST http://localhost:3000/test-discord
```
This tests the Discord webhook integration by sending a test message. If you have Discord configured, you should receive a green "Test Notification" message.

### 2. Test Internal Server Error (500 - Sends Discord Notification)
```bash
curl http://localhost:3000/test-error
```
This will trigger an internal server error and automatically send a Discord notification with full error details.

### 3. Test Business Logic Error (400 - No Discord Notification)
```bash
curl http://localhost:3000/test-business-error
```
This triggers a business logic error. Since it's a 4xx error, it won't send a Discord notification (only 5xx errors trigger Discord alerts).

### 4. Test Regular Endpoint
```bash
curl http://localhost:3000/
```
This should return "Hello World!" without any errors.

## Setting up Discord Webhook (Required for notifications)

To receive actual Discord notifications, you need to:

1. **Create a Discord webhook:**
   - Go to your Discord server
   - Right-click on a channel → Edit Channel
   - Go to Integrations → Webhooks
   - Create a new webhook and copy the URL

2. **Create a `.env` file with your webhook URL:**
```bash
# .env file
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
DISCORD_NOTIFICATIONS_ENABLED=true
NODE_ENV=development
```

3. **Restart the server** after adding the environment variables.

## What to Expect

### With Discord Configured:
- `POST /test-discord` → Green test message in Discord
- `GET /test-error` → Red error notification in Discord with full details
- `GET /test-business-error` → No Discord notification (4xx errors are not sent to Discord)

### Without Discord Configured:
- All errors will still be logged to the console with structured JSON
- Discord notifications will be silently skipped
- Your application will continue to work normally

## Example Discord Notification

When you trigger `/test-error`, you should see something like this in Discord:

```
💥 Internal Server Error
This is a test internal server error for Discord notifications

Status Code: 500
Path: /test-error
Method: GET
Correlation ID: 1726139445123-abc123def
IP Address: 127.0.0.1
User Agent: curl/7.68.0

Stack Trace:
```
Error: This is a test internal server error for Discord notifications
    at AppController.testInternalServerError...
```

Environment: development
```

## Testing Commands

Run these in your terminal to test:

```bash
# Test basic functionality
curl http://localhost:3000/

# Test Discord webhook (if configured)
curl -X POST http://localhost:3000/test-discord

# Test internal server error (triggers Discord notification)
curl http://localhost:3000/test-error

# Test business error (logged but no Discord notification)
curl http://localhost:3000/test-business-error
```

The server is ready for testing! 🚀
