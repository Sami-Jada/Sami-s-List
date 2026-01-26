# Authentication Module

Complete phone-based OTP authentication system for Sami's List gas delivery application.

## Features

- ✅ Phone-based registration and login with OTP
- ✅ JWT authentication with access tokens (15 min) and refresh tokens (7 days)
- ✅ Token refresh endpoint with rotation
- ✅ Password-less authentication flow
- ✅ Role-based access control (USER, VENDOR, DRIVER, ADMIN)
- ✅ Rate limiting on auth endpoints
- ✅ Token versioning for instant invalidation
- ✅ Device tracking support
- ✅ Comprehensive error handling and logging

## API Endpoints

### POST /auth/send-otp
Send OTP to phone number for authentication.

**Rate Limit**: 3 requests per phone per 15 minutes

**Request:**
```json
{
  "phone": "+962791234567"
}
```

**Response:**
```json
{
  "message": "OTP has been sent to your phone number"
}
```

### POST /auth/verify-otp
Verify OTP and receive access/refresh tokens.

**Rate Limit**: 5 attempts per phone per 15 minutes

**Request:**
```json
{
  "phone": "+962791234567",
  "otp": "123456"
}
```

**Headers (Optional):**
- `x-device-id`: Device identifier for tracking

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "phone": "+962791234567",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token (with rotation).

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout
Logout and invalidate refresh token.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request (Optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### POST /auth/me
Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "id": "uuid",
  "phone": "+962791234567",
  "name": "User Name",
  "email": "user@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Usage in Controllers

### Protect Routes

By default, all routes are protected. Use `@Public()` to make a route public:

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Public()
  @Get()
  getPublicData() {
    return { message: 'This is public' };
  }
}
```

### Role-Based Access Control

Use `@Roles()` decorator to restrict access to specific roles:

```typescript
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  @Roles('ADMIN')
  @Get()
  getAdminData() {
    return { message: 'Admin only' };
  }

  @Roles('ADMIN', 'VENDOR')
  @Get('vendors')
  getVendorData() {
    return { message: 'Admin or Vendor' };
  }
}
```

### Get Current User

Use `@CurrentUser()` decorator to get the authenticated user:

```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: any) {
    return {
      userId: user.userId,
      phone: user.phone,
    };
  }
}
```

## Security Features

### Rate Limiting
- **Send OTP**: 3 requests per phone per 15 minutes
- **Verify OTP**: 5 attempts per phone per 15 minutes
- Uses Redis for distributed rate limiting

### Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Token rotation on refresh (old token invalidated)
- Token versioning for instant invalidation
- Refresh tokens stored in Redis

### OTP Security
- 6-digit random OTP codes
- OTPs hashed with bcrypt before storing in Redis
- 5-minute expiry (configurable via `OTP_EXPIRY_SECONDS`)
- One-time use (deleted after verification)
- Generic error messages (don't reveal if phone exists)

### Logging
- All authentication attempts logged
- Failed attempts logged with IP address
- Security events logged (token invalidation, etc.)

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# OTP Configuration
OTP_EXPIRY_SECONDS=300
```

## OTP Service

Currently, OTPs are logged to console for development. To integrate with SMS provider:

1. Update `OtpService.generateAndStoreOtp()` method
2. Replace console.log with SMS provider API call
3. Add SMS provider credentials to environment variables

Example with Twilio (TODO in code):
```typescript
// TODO: Integrate with Twilio
// const message = await twilioClient.messages.create({
//   body: `Your OTP code is: ${otp}`,
//   from: process.env.TWILIO_PHONE_NUMBER,
//   to: phone,
// });
```

## Token Versioning

Token versioning allows instant invalidation of all user tokens:

```typescript
// Invalidate all tokens for a user (e.g., on security breach)
await tokenService.invalidateAllUserTokens(userId);
```

This increments the token version, invalidating all existing tokens for that user.

## Device Tracking

Device tracking is optional. Pass `x-device-id` header when verifying OTP:

```bash
curl -X POST /auth/verify-otp \
  -H "x-device-id: device-uuid-123" \
  -d '{"phone": "+962791234567", "otp": "123456"}'
```

Device ID is stored with refresh tokens for session management.

## Error Handling

All authentication errors return generic messages to prevent information leakage:

- Invalid OTP: "Invalid or expired OTP code"
- Expired token: "Invalid or expired access token"
- Rate limit: "Too many requests. Please try again in 15 minutes."

Detailed errors are logged server-side for debugging.





