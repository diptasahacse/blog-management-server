# Authentication System

A professional authentication system implemented for the NestJS blog application.

## Features

- **User Registration**: Secure user registration with password hashing
- **User Login**: JWT-based authentication with access and refresh tokens
- **Token Refresh**: Automatic token refresh mechanism
- **Password Change**: Secure password change functionality
- **Role-Based Access Control**: Admin and user roles with guards
- **Security**: bcrypt password hashing, JWT tokens, guards, and strategies

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile (requires authentication)
- `PATCH /auth/change-password` - Change password (requires authentication)
- `GET /auth/admin-only` - Admin-only endpoint (requires admin role)

### Request/Response Examples

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "user" // optional, defaults to "user"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Response (Register/Login)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### Change Password
```bash
PATCH /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds of 12
2. **JWT Tokens**: 
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
3. **Guards**: 
   - JWT Auth Guard for protected routes
   - Local Auth Guard for login
   - Roles Guard for role-based access
4. **Validation**: Input validation using class-validator
5. **Error Handling**: Proper error messages and HTTP status codes

## Usage in Controllers

### Protecting Routes

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@GetUser() user: any) {
  return { message: `Hello ${user.email}` };
}
```

### Role-Based Protection

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin-only')
async adminOnly() {
  return { message: 'Admin access granted' };
}
```

## Token Usage

Include the access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Database Schema

The authentication system uses the existing user table with these fields:
- `id`: UUID primary key
- `name`: User's full name
- `email`: Unique email address
- `password`: Hashed password
- `role`: User role (admin/user)
- `verifiedAt`: Email verification timestamp
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

## Error Handling

The system provides proper error responses:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid credentials or token
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: User already exists

## Testing

Test files are included for both the service and controller:
- `auth.service.spec.ts`
- `auth.controller.spec.ts`

Run tests with:
```bash
npm run test
```

## Security Best Practices Implemented

1. **Strong Password Requirements**: Minimum 8 characters
2. **Secure Token Storage**: Use environment variables for secrets
3. **Short-lived Access Tokens**: 15-minute expiration
4. **Refresh Token Rotation**: Recommended for production
5. **Input Validation**: Comprehensive validation on all inputs
6. **Error Information Disclosure**: Limited error details to prevent attacks
7. **Rate Limiting**: Consider adding rate limiting in production
8. **HTTPS**: Always use HTTPS in production

## Next Steps for Production

1. Add rate limiting on auth endpoints
2. Implement email verification
3. Add password reset functionality
4. Implement refresh token rotation
5. Add login attempt monitoring
6. Consider adding 2FA
7. Add session management
8. Implement account lockout after failed attempts
