# Professional Global Error Handler

This implementation provides a comprehensive error handling system for the NestJS application with the following features:

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

### 3. **Comprehensive Logging**
- Structured JSON logging
- Request context preservation
- Correlation ID tracking
- Environment-based log levels

### 4. **Custom Exception Classes**
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

## Usage Examples

### Using Custom Exceptions

```typescript
import { ResourceNotFoundException, BusinessLogicException } from '@/common/exceptions/custom.exceptions';

// In your service
async findUserById(id: number) {
  const user = await this.userRepository.findById(id);
  if (!user) {
    throw new ResourceNotFoundException('User', id);
  }
  return user;
}

// Business logic validation
async updateUserEmail(userId: number, email: string) {
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

### Logging Integration

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
      this.logger.error('Failed to create user', error.stack, 'UserService');
      throw error;
    }
  }
}
```

## Configuration

### Environment Variables

- `NODE_ENV`: Controls error detail exposure
  - `development`: Full error details including stack traces
  - `production`: Sanitized error messages

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

1. **Consistent Error Handling**: All errors follow the same structure
2. **Better Debugging**: Correlation IDs and structured logging
3. **Security**: Sensitive information hidden in production
4. **User Experience**: Clear, actionable error messages
5. **Monitoring**: Easy integration with monitoring tools
6. **Maintainability**: Centralized error handling logic

## Files Structure

```
src/common/
├── all-exceptions.filter.ts          # Main global exception filter
├── common.module.ts                  # Common module for DI
├── enums/
│   └── error-codes.enum.ts          # Error code definitions
├── exceptions/
│   └── custom.exceptions.ts         # Custom exception classes
├── errors/
│   └── handlerDrizzleQueryError.ts  # Database error handler
├── services/
│   └── logger.service.ts            # Professional logging service
├── types/
│   └── common.ts                    # Type definitions
└── utils/
    └── correlation-id.util.ts       # Correlation ID generator
```

This error handling system follows enterprise-level best practices and provides comprehensive error management for production applications.
