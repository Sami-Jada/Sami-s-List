# Drivers Module

Complete driver management module for Sami's List gas delivery application.

## Features

- ✅ Driver CRUD operations
- ✅ Driver location tracking
- ✅ Availability management
- ✅ Driver rating calculation
- ✅ Vendor-driver relationship management
- ✅ Role-based access control
- ✅ Vehicle info validation
- ✅ Coordinate validation
- ✅ Comprehensive error handling and logging

## API Endpoints

### Vendor/Admin Endpoints

#### GET /vendors/:vendorId/drivers
Get all drivers for a vendor.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Ahmad Al-Mahmoud",
    "phone": "+962791234567",
    "vehicleInfo": {
      "type": "Truck",
      "plateNumber": "AMM-1234",
      "color": "White"
    },
    "isAvailable": true,
    "rating": 4.8,
    "totalDeliveries": 150
  }
]
```

#### GET /vendors/:vendorId/drivers/available
Get available drivers for a vendor.

**Headers:**
- `Authorization: Bearer <access_token>`

#### POST /vendors/:vendorId/drivers
Create a new driver for a vendor.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "vendorId": "vendor-uuid",
  "name": "Ahmad Al-Mahmoud",
  "phone": "+962791234567",
  "vehicleInfo": {
    "type": "Truck",
    "plateNumber": "AMM-1234",
    "color": "White"
  }
}
```

### Driver/Vendor/Admin Endpoints

#### GET /drivers/:id
Get driver details.

**Headers:**
- `Authorization: Bearer <access_token>`

#### PATCH /drivers/:id
Update driver information.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "name": "Updated Name",
  "vehicleInfo": {
    "type": "Van",
    "plateNumber": "AMM-5678",
    "color": "Blue"
  }
}
```

### Driver-Only Endpoints

#### PUT /drivers/:id/location
Update driver current location (driver only).

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "latitude": 31.9539,
  "longitude": 35.9106
}
```

**Note:** Location updates are logged for tracking/debugging.

#### PUT /drivers/:id/toggle-availability
Toggle driver availability status (driver only).

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "id": "uuid",
  "isAvailable": true,
  ...
}
```

## Validation

### Vehicle Info
Must contain:
- `type`: Vehicle type (e.g., "Truck", "Van", "Car")
- `plateNumber`: License plate number
- `color`: Vehicle color

### Coordinates
- **Latitude**: 29-34 (Jordan bounds)
- **Longitude**: 34-40 (Jordan bounds)

### Phone Numbers
- Jordan format: `+962[789]XXXXXXXX`

## Role-Based Access Control

- **ADMIN**: Full access to all drivers
- **VENDOR**: Can manage drivers for their own vendor
- **DRIVER**: Can update their own info and location

## Services

### DriversService

- `findAll(filters?)`: Get drivers with optional filters
- `findById(id)`: Get driver by ID
- `findByVendor(vendorId)`: Get all drivers for a vendor
- `findAvailable(vendorId)`: Get available drivers for a vendor
- `create(vendorId, dto)`: Create new driver
- `update(id, dto)`: Update driver
- `updateLocation(id, dto)`: Update driver location
- `toggleAvailability(id)`: Toggle availability
- `updateRating(id)`: Recalculate rating from order ratings
- `verifyDriverOwnership(driverId, vendorId)`: Verify driver belongs to vendor

## Error Handling

- `400 Bad Request`: Validation errors, invalid coordinates, phone already exists
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions or driver doesn't belong to vendor
- `404 Not Found`: Driver or vendor not found

## Logging

The following operations are logged:
- Driver creation
- Driver updates
- Location updates (with coordinates)
- Availability changes
- Rating updates

## Vehicle Info Structure

```typescript
{
  type: string;        // e.g., "Truck", "Van", "Car"
  plateNumber: string; // e.g., "AMM-1234"
  color: string;      // e.g., "White", "Blue"
}
```

## Usage Examples

### Create Driver
```typescript
const driver = await driversService.create(vendorId, {
  vendorId,
  name: 'Ahmad Al-Mahmoud',
  phone: '+962791234567',
  vehicleInfo: {
    type: 'Truck',
    plateNumber: 'AMM-1234',
    color: 'White',
  },
});
```

### Update Location
```typescript
await driversService.updateLocation(driverId, {
  latitude: 31.9539,
  longitude: 35.9106,
});
```

### Find Available Drivers
```typescript
const availableDrivers = await driversService.findAvailable(vendorId);
```





