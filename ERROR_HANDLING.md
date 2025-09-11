# Professional Global Error Handler with Discord Integration

This implementation provides a comprehensive error handling system for the NestJS application with real-time Discord notifications for critical errors.

## Features

### 1. **Structured Error Responses**
- Consistent error response format across the application
- Correlation IDs for request tracking
- Detailed error information with proper HTTP status codes
- Environment-based error detail exposure

### 2. **Professional Error Types Handling**
- HTTP Exceptions (validation, authentication, etc.)
- Database Errors (Drizzle ORM with PostgreSQL)
- Generic Application Errors
- Unknown Error Types

### 3. **Discord Integration**
- Real-time error notifications to Discord channels
- Rich embed messages with detailed error information
- Color-coded notifications based on severity
- Rate limiting and error handling for webhook failures

### 4. **Comprehensive Logging**
- Structured JSON logging
- Request context preservation
- Correlation ID tracking
- Environment-based log levels

### 5. **Custom Exception Classes**
- `BusinessLogicException` - For business rule violations
- `ResourceNotFoundException` - For missing resources
- `DuplicateResourceException` - For duplicate entries
- `ValidationException` - For validation failures
- `UnauthorizedException` - For authentication issues
- `ForbiddenException` - For authorization issues

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    {
      "path": "email",
      "message": "Email must be valid",
      "code": "VALIDATION_FAILED"
    }
  ],
  "timestamp": "2025-09-12T10:30:45.123Z",
  "path": "/api/users",
  "correlationId": "1726139445123-abc123def"
}
```

## Discord Integration Setup

### Environment Variables

Add these to your `.env` file:

```bash
# Discord webhook URL for error notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN

# Enable/disable Discord notifications
DISCORD_NOTIFICATIONS_ENABLED=true

# Environment setting (affects notification content)
NODE_ENV=development
```

### Discord Webhook Setup

1. Go to your Discord server
2. Edit the channel where you want notifications
3. Go to Integrations > Webhooks
4. Create a new webhook and copy the URL
5. Add the URL to your environment variables

See [DISCORD_SETUP.md](./DISCORD_SETUP.md) for detailed setup instructions.

## Testing the Integration

### Test Endpoints

The application includes several test endpoints:

```bash
# Test Discord webhook integration
curl -X POST http://localhost:3000/test-discord

# Trigger internal server error (sends Discord notification)
curl http://localhost:3000/test-error

# Trigger business logic error
curl http://localhost:3000/test-business-error
```

### Expected Discord Notification

When an internal server error occurs, you'll receive a Discord notification like:

```
💥 Internal Server Error
This is a test internal server error for Discord notifications

Status Code: 500
Path: /test-error
Method: GET
Correlation ID: 1726139445123-abc123def
IP Address: 127.0.0.1

Environment: development
```

## Usage Examples

### Using Custom Exceptions

```typescript
import { ResourceNotFoundException, BusinessLogicException } from '@/common/exceptions/custom.exceptions';

// In your service
async findUserById(id: string) {
  const user = await this.userRepository.findById(id);
  if (!user) {
    throw new ResourceNotFoundException('User', id);
  }
  return user;
}

// Business logic validation
async updateUserEmail(userId: string, email: string) {
  if (await this.isEmailTaken(email)) {
    throw new BusinessLogicException('Email is already in use');
  }
  // ... update logic
}
```

### Database Error Handling

The system automatically handles common PostgreSQL errors:
- **23505**: Duplicate key violations
- **23503**: Foreign key constraint violations  
- **23502**: Not null constraint violations
- **08000**: Database connection errors

### Logging with Discord Integration

```typescript
import { LoggerService } from '@/common/services/logger.service';

@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async createUser(userData: CreateUserDto) {
    try {
      this.logger.log('Creating new user', 'UserService');
      // ... business logic
    } catch (error) {
      // This will log the error AND send Discord notification for 5xx errors
      this.logger.error('Failed to create user', error.stack, 'UserService');
      throw error;
    }
  }
}
```

## Discord Notification Features

### Notification Types

1. **Error Notifications (Automatic)**
   - Triggered on 5xx server errors
   - Rich embed with error details
   - Includes stack trace in development

2. **Critical Alerts (Manual)**
   ```typescript
   await this.discordNotificationService.sendCriticalAlert(
     'Database connection lost',
     { connectionString: 'postgresql://...', retryAttempts: 3 }
   );
   ```

3. **Test Messages**
   ```typescript
   await this.discordNotificationService.sendTestMessage();
   ```

### Notification Content

Discord notifications include:
- **Status Code** and **Error Type**
- **Request Path** and **HTTP Method**
- **Correlation ID** for tracking
- **IP Address** and **User Agent**
- **Error Details** and **Stack Trace** (in development)
- **Timestamp** and **Environment Info**

### Color Coding
- 🚨 **Red (0xff0000)**: Internal server errors (5xx)
- ⚠️ **Orange (0xff9900)**: Client errors (4xx)  
- ✅ **Green (0x00ff00)**: Success/test messages

## Configuration

### Environment Variables

- `NODE_ENV`: Controls error detail exposure
  - `development`: Full error details including stack traces
  - `production`: Sanitized error messages

- `DISCORD_WEBHOOK_URL`: Discord webhook URL for notifications
- `DISCORD_NOTIFICATIONS_ENABLED`: Enable/disable Discord notifications

### Error Codes

The system uses predefined error codes from `ErrorCodes` enum:
- `DUPLICATE_ENTRY`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_FAILED`
- `UNAUTHORIZED_ACCESS`
- `FORBIDDEN_OPERATION`
- `INTERNAL_SERVER_ERROR`
- And more...

## Benefits

1. **Real-time Monitoring**: Immediate Discord notifications for critical errors
2. **Consistent Error Handling**: All errors follow the same structure
3. **Better Debugging**: Correlation IDs and structured logging
4. **Security**: Sensitive information hidden in production
5. **User Experience**: Clear, actionable error messages
6. **Team Collaboration**: Shared error visibility via Discord
7. **Maintainability**: Centralized error handling logic

## Files Structure

```
src/common/
├── all-exceptions.filter.ts              # Main global exception filter
├── common.module.ts                      # Common module for DI
├── enums/
│   └── error-codes.enum.ts              # Error code definitions
├── exceptions/
│   └── custom.exceptions.ts             # Custom exception classes
├── errors/
│   └── handlerDrizzleQueryError.ts      # Database error handler
├── services/
│   ├── logger.service.ts                # Professional logging service
│   └── discord-notification.service.ts  # Discord integration service
├── types/
│   └── common.ts                        # Type definitions
└── utils/
    └── correlation-id.util.ts           # Correlation ID generator
```

## Security Considerations

1. **Webhook URL Security**: Keep Discord webhook URLs secret
2. **Error Information**: Stack traces only shown in development
3. **Rate Limiting**: Discord webhooks have built-in rate limiting
4. **Environment Separation**: Different configurations per environment

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production Discord webhooks
3. Set `DISCORD_NOTIFICATIONS_ENABLED=true`
4. Monitor webhook delivery and application logs

This error handling system with Discord integration provides enterprise-level error management with real-time team notifications for production applications.
