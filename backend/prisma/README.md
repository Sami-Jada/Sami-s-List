# Prisma Database Setup

This directory contains the Prisma schema, migrations, and seed scripts for the Sami's List gas delivery application.

## Schema Overview

The database schema includes the following models:

- **User**: Application users (customers)
- **Address**: User delivery addresses with geolocation
- **Vendor**: Gas delivery vendors with location and pricing
- **Driver**: Delivery drivers assigned to vendors
- **Order**: Gas cylinder orders with full lifecycle tracking
- **OrderStatusHistory**: Complete audit trail of order status changes
- **Payment**: Payment transactions linked to orders
- **Rating**: User ratings for orders, drivers, and vendors

## Key Features

- **UUID Primary Keys**: All models use UUID for primary keys
- **Geolocation Support**: PostGIS extension enabled for location-based queries
- **Decimal Precision**: All monetary values use Decimal type for accuracy
- **Indexes**: Optimized indexes on frequently queried fields
- **Cascade Deletes**: Proper foreign key constraints with cascade rules
- **Encryption Ready**: Sensitive fields (phone numbers, addresses) marked for encryption

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   cp env.example .env
   # Update DATABASE_URL in .env
   ```

3. **Run Migrations**
   ```bash
   npm run prisma:migrate
   ```
   This will:
   - Enable PostGIS extension
   - Create all tables
   - Set up indexes
   - Configure foreign keys

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Seed Database** (Optional)
   ```bash
   npm run prisma:seed
   ```
   This creates:
   - 1 vendor (Al-Ahli Gas Company)
   - 2 drivers
   - 3 users
   - 4 addresses
   - 3 sample orders
   - 2 payments
   - 1 rating

## Database Queries

### Geo Queries

The `PrismaGeoService` provides helper functions for geolocation queries:

```typescript
// Find nearest vendors
const vendors = await geoService.findNearestVendors(
  { latitude: 31.9539, longitude: 35.9106 },
  10, // max distance in km
  10  // limit results
);

// Find nearest available drivers
const drivers = await geoService.findNearestDrivers(
  { latitude: 31.9539, longitude: 35.9106 },
  vendorId, // optional vendor filter
  5,  // max distance in km
  5   // limit results
);

// Calculate distance between address and vendor
const distance = await geoService.calculateAddressToVendorDistance(
  addressId,
  vendorId
);
```

## Order Number Generation

Order numbers are automatically generated using UUID format. For production, consider implementing a sequential order number system:

```typescript
// Example: ORD-2024-000001
const orderNumber = `ORD-${year}-${sequenceNumber}`;
```

## Security Notes

⚠️ **Important**: Phone numbers and addresses are stored as plain text in the seed script for development purposes. In production:

1. Encrypt phone numbers before storing
2. Consider encrypting sensitive address fields
3. Use environment variables for encryption keys
4. Implement field-level encryption in the application layer

## Migration Commands

```bash
# Create a new migration
npm run prisma:migrate dev --name migration_name

# Apply migrations
npm run prisma:migrate deploy

# Reset database (WARNING: Deletes all data)
npm run prisma:migrate reset

# View database in Prisma Studio
npm run prisma:studio
```

## Indexes

The following indexes are created for performance:

- **Users**: phone, email
- **Addresses**: userId, (latitude, longitude) for geo queries
- **Vendors**: phone, (latitude, longitude) for geo queries, isActive
- **Drivers**: vendorId, phone, isAvailable, (currentLatitude, currentLongitude)
- **Orders**: userId, vendorId, driverId, status, orderNumber, createdAt
- **Payments**: orderId, userId, status, transactionId
- **Ratings**: orderId, userId, driverId, vendorId, rating

## PostGIS Extension

PostGIS is enabled in the initial migration for advanced geolocation queries. While the current implementation uses Haversine formula for distance calculations, PostGIS can be used for more complex spatial queries:

```sql
-- Example PostGIS query (not currently used, but available)
SELECT *, ST_Distance(
  ST_MakePoint(longitude, latitude),
  ST_MakePoint(35.9106, 31.9539)
) AS distance
FROM vendors
ORDER BY distance
LIMIT 10;
```





