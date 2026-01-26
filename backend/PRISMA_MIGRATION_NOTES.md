# Prisma Schema Migration Notes

## Important Changes from Previous Schema

### User Model
- **Removed**: `password`, `firstName`, `lastName`, `role`, `isActive`
- **Added**: `name` (single field instead of firstName/lastName)
- **Changed**: `email` is now optional
- **Note**: Phone numbers should be encrypted in the application layer

### Vendor Model
- **Removed**: `userId` (vendors are now standalone, not tied to User)
- **Removed**: `businessName`, `licenseNumber`, `isVerified`
- **Added**: `name`, `phone`, `businessLicense`, `address`, `latitude`, `longitude`, `tankPrice`, `serviceFee`, `rating`, `totalOrders`
- **Note**: Phone numbers should be encrypted

### Driver Model
- **Removed**: `userId` (drivers are now standalone)
- **Removed**: `licenseNumber`
- **Added**: `name`, `phone`, `vehicleInfo` (JSON), `currentLatitude`, `currentLongitude`, `isAvailable`, `rating`, `totalDeliveries`
- **Note**: Phone numbers should be encrypted

### Address Model
- **Changed**: `label` is now an enum (HOME, WORK, OTHER)
- **Changed**: `street` → `addressLine`
- **Removed**: `building`, `floor`, `apartment`, `district`, `coordinates` (JSON string)
- **Added**: `latitude`, `longitude` as separate Decimal fields
- **Removed**: `updatedAt`

### Order Model
- **Added**: `orderNumber` (unique, generated)
- **Removed**: `cylinderType`, `notes`, `scheduledAt`
- **Changed**: `quantity` → `tankQuantity`
- **Added**: `tankPrice`, `serviceFee`, `totalPrice` (separate fields)
- **Removed**: `totalAmount`
- **Added**: `paymentMethod` (enum), `paymentStatus` (enum), `estimatedDeliveryTime`
- **Changed**: Status enum values (PENDING, ACCEPTED, ASSIGNED, EN_ROUTE, DELIVERED, COMPLETED, REJECTED, CANCELLED)

### New Models
- **OrderStatusHistory**: Tracks complete order status change history
- **Rating**: User ratings for orders, drivers, and vendors

### Payment Model
- **Added**: `metadata` (JSON field for additional payment data)
- **Removed**: `paidAt` (can be derived from status and metadata)

## Authentication Changes Required

⚠️ **IMPORTANT**: The User model no longer has a `password` field. You need to update authentication:

1. **Option 1**: Implement phone-based OTP authentication
2. **Option 2**: Use external authentication service
3. **Option 3**: Add password back if needed (not recommended for this use case)

Current auth service (`auth.service.ts`) still references password and email. Update to use phone-based auth.

## Migration Steps

1. **Backup existing data** (if any)
2. **Reset database**:
   ```bash
   npm run prisma:migrate reset
   ```
3. **Run new migration**:
   ```bash
   npm run prisma:migrate dev
   ```
4. **Seed database**:
   ```bash
   npm run prisma:seed
   ```

## Breaking Changes in Services

The following services need updates:

1. **AuthService**: Remove password-based authentication
2. **UsersService**: Update to use `name` instead of `firstName`/`lastName`
3. **VendorsService**: Remove user relation, update DTOs
4. **OrdersService**: Update to use new order fields
5. **All DTOs**: Update to match new schema

## PostGIS Extension

PostGIS is enabled in the migration for future geolocation queries. Currently using Haversine formula in `PrismaGeoService`, but PostGIS functions are available for more advanced queries.

## Encryption Requirements

Mark these fields for encryption in production:
- `User.phone`
- `Vendor.phone`
- `Driver.phone`
- `Address.addressLine` (consider encrypting)

Implement field-level encryption before storing these values.





