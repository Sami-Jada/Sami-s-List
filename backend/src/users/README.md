# Users Module

Complete user profile and address management module for Sami's List gas delivery application.

## Features

- ✅ User profile management (CRUD operations)
- ✅ Address management with geolocation validation
- ✅ Jordan coordinate bounds validation
- ✅ Default address management
- ✅ GDPR-style account deletion with data anonymization
- ✅ Phone number validation (Jordan format)
- ✅ Ownership verification (users can only access their own data)
- ✅ Comprehensive error handling and logging

## API Endpoints

### User Profile

#### GET /users/me
Get current user profile.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "id": "uuid",
  "phone": "+962791234567",
  "name": "Ahmad Al-Mahmoud",
  "email": "ahmad@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PATCH /users/me
Update current user profile.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "name": "Ahmad Al-Mahmoud",
  "email": "ahmad@example.com"
}
```

**Note:** Phone number cannot be changed for security reasons.

#### DELETE /users/me
Delete current user account (soft delete with anonymization).

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "message": "Account deleted successfully. Your data has been anonymized."
}
```

**Note:** User data is anonymized (phone becomes `DELETED_[timestamp]`, name/email cleared) but orders are kept for analytics.

### Addresses

#### GET /users/me/addresses
Get all addresses for current user.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "label": "HOME",
    "addressLine": "123 Jabal Amman, Building 5, Apartment 12",
    "city": "Amman",
    "latitude": "31.9539",
    "longitude": "35.9106",
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /users/me/addresses
Create a new address.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "label": "HOME",
  "addressLine": "123 Jabal Amman, Building 5, Apartment 12",
  "city": "Amman",
  "latitude": 31.9539,
  "longitude": 35.9106,
  "isDefault": false
}
```

**Validation:**
- `label`: Must be one of: HOME, WORK, OTHER
- `latitude`: Must be between 29-34 (Jordan bounds)
- `longitude`: Must be between 34-40 (Jordan bounds)

#### PATCH /users/me/addresses/:id
Update an address.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "addressLine": "456 King Abdullah II Street",
  "isDefault": true
}
```

**Note:** All fields are optional. Setting `isDefault: true` automatically unsets other default addresses.

#### DELETE /users/me/addresses/:id
Delete an address.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "message": "Address deleted successfully"
}
```

#### PUT /users/me/addresses/:id/default
Set an address as default.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "label": "HOME",
  "addressLine": "123 Jabal Amman",
  "city": "Amman",
  "latitude": "31.9539",
  "longitude": "35.9106",
  "isDefault": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** Automatically unsets previous default address.

## Validation Rules

### Phone Numbers
- Format: `+962XXXXXXXXX` (Jordan international format)
- Must start with `+962` followed by 9 digits
- Valid prefixes: 7, 8, or 9 (mobile numbers)

### Coordinates
- **Latitude**: Must be between 29-34 (Jordan bounds)
- **Longitude**: Must be between 34-40 (Jordan bounds)
- Validation occurs on both create and update

### Address Labels
- `HOME`: Home address
- `WORK`: Work address
- `OTHER`: Other address type

## Security Features

### Ownership Verification
- All endpoints verify that users can only access their own data
- Address operations check ownership before allowing modifications
- Returns `403 Forbidden` if user tries to access another user's data

### Data Anonymization
When a user deletes their account:
- Phone number: `DELETED_[timestamp]`
- Name: Empty string
- Email: `null`
- Orders: Kept for analytics but user data is anonymized

### Error Handling
- `400 Bad Request`: Validation errors, duplicate email/phone
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User trying to access another user's resource
- `404 Not Found`: Resource doesn't exist

## Logging

The following operations are logged:
- User creation
- User profile updates
- Account deletion (with anonymization warning)
- Address creation/updates/deletion
- Default address changes

## Usage Examples

### Update User Profile
```typescript
// In a controller
@Patch('me')
async updateProfile(
  @CurrentUser() user: any,
  @Body() updateUserDto: UpdateUserDto,
) {
  return this.usersService.update(user.userId, updateUserDto);
}
```

### Create Address
```typescript
// In a controller
@Post('me/addresses')
async createAddress(
  @CurrentUser() user: any,
  @Body() createAddressDto: CreateAddressDto,
) {
  return this.addressesService.create(user.userId, createAddressDto);
}
```

### Set Default Address
```typescript
// In a controller
@Put('me/addresses/:id/default')
async setDefaultAddress(
  @CurrentUser() user: any,
  @Param('id') addressId: string,
) {
  return this.addressesService.setDefault(user.userId, addressId);
}
```

## DTOs

### CreateUserDto
- `phone`: string (required, Jordan format)
- `name`: string (required)
- `email`: string (optional)

### UpdateUserDto
- `name`: string (optional)
- `email`: string (optional)
- Note: Phone cannot be changed

### CreateAddressDto
- `label`: AddressLabel enum (required)
- `addressLine`: string (required)
- `city`: string (required, default: "Amman")
- `latitude`: number (required, 29-34)
- `longitude`: number (required, 34-40)
- `isDefault`: boolean (optional, default: false)

### UpdateAddressDto
- All fields from CreateAddressDto are optional

## Error Responses

### Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "Phone number must be a valid Jordan number in format +962XXXXXXXXX",
    "Latitude must be between 29 and 34 (Jordan bounds)"
  ],
  "error": "Bad Request"
}
```

### Forbidden Error
```json
{
  "statusCode": 403,
  "message": "You do not have access to this address",
  "error": "Forbidden"
}
```

### Not Found Error
```json
{
  "statusCode": 404,
  "message": "Address with ID abc123 not found",
  "error": "Not Found"
}
```





