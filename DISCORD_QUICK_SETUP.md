# 🚀 Quick Discord Setup Guide

Follow these steps to set up Discord error notifications for your Blog API:

## Step 1: Create a Discord Webhook

### Option A: If you have a Discord server
1. Open Discord and go to your server
2. Right-click on the channel where you want notifications
3. Select **"Edit Channel"**
4. Click **"Integrations"** in the left sidebar
5. Click **"Create Webhook"**
6. Configure:
   - **Name**: `Blog API Errors`
   - **Channel**: Your desired channel
7. **Copy the Webhook URL**

### Option B: If you don't have a Discord server
1. Open Discord
2. Click the **"+"** button on the left sidebar
3. Select **"Create My Own"**
4. Choose **"For me and my friends"**
5. Give your server a name (e.g., "My Blog API")
6. Create a channel called **"api-errors"**
7. Follow steps 2-7 from Option A

## Step 2: Update Your Environment Variables

1. Open the `.env` file in your project root
2. Replace `YOUR_WEBHOOK_URL` with your actual Discord webhook URL

```env
# Before (what you currently have)
DISCORD_WEBHOOK_URL=YOUR_WEBHOOK_URL

# After (replace with your actual webhook URL)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890123456789/abcdefghijklmnopqrstuvwxyz-1234567890_ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

## Step 3: Restart Your Server

After updating the `.env` file, restart your NestJS server:

```bash
# Stop the current server (Ctrl+C if running)
# Then restart:
npm run start:dev
```

## Step 4: Test the Integration

Once your server is running, test the Discord integration:

### Test 1: Discord Webhook Test
```bash
# This should send a green "Test Notification" to Discord
Invoke-RestMethod -Uri "http://localhost:3000/test-discord" -Method Post
```

### Test 2: Error Notification Test
```bash
# This should send a red "Internal Server Error" notification to Discord
Invoke-RestMethod -Uri "http://localhost:3000/test-error" -Method Get
```

## What You Should See in Discord

### Test Notification (Green):
```
✅ Test Notification
Discord integration is working correctly!

Environment: development
Timestamp: [current time]
```

### Error Notification (Red):
```
💥 Internal Server Error
This is a test internal server error for Discord notifications

Status Code: 500
Path: /test-error
Method: GET
Correlation ID: [unique ID]
IP Address: 127.0.0.1
User Agent: [your browser/tool]

Stack Trace: [error details in development mode]
Environment: development
```

## Troubleshooting

### If notifications don't appear:
1. **Check webhook URL**: Make sure it's copied correctly without extra spaces
2. **Check channel permissions**: Ensure the webhook has permission to post in the channel
3. **Check environment variables**: Restart the server after changing `.env`
4. **Check console**: Look for "Failed to send Discord notification" errors

### If you get "Discord notifications are not enabled" error:
1. Make sure `DISCORD_NOTIFICATIONS_ENABLED=true` in your `.env` file
2. Make sure `DISCORD_WEBHOOK_URL` is set and not empty
3. Restart your server

## Security Notes

⚠️ **Important**: 
- Never commit your `.env` file to version control
- Keep your Discord webhook URL secret
- Add `.env` to your `.gitignore` file

## Sample Webhook URL Format

Your webhook URL should look like this:
```
https://discord.com/api/webhooks/[WEBHOOK_ID]/[WEBHOOK_TOKEN]
```

Where:
- `[WEBHOOK_ID]` is a long number (e.g., 1234567890123456789)
- `[WEBHOOK_TOKEN]` is a long string with letters, numbers, and special characters

That's it! Your Discord error notifications should now be working! 🎉
