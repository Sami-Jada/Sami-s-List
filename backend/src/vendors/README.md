# Vendors Module

Complete vendor management module for Sami's List gas delivery application.

## Features

- ✅ Vendor CRUD operations
- ✅ PostGIS-based nearest vendor queries
- ✅ Vendor filtering (active status, rating, distance)
- ✅ Vendor rating calculation from order ratings
- ✅ Role-based access control
- ✅ Coordinate validation (Jordan bounds)
- ✅ Comprehensive error handling and logging

## API Endpoints

### Public Endpoints

#### GET /vendors
Get all active vendors with optional filters.

**Query Parameters:**
- `isActive` (boolean): Filter by active status
- `minRating` (number): Minimum rating (0-5)
- `maxDistance` (number): Maximum distance in km
- `latitude` (number): Latitude for distance calculation
- `longitude` (number): Longitude for distance calculation

**Example:**
```
GET /vendors?isActive=true&minRating=4.0&maxDistance=10&latitude=31.9539&longitude=35.9106
```

#### GET /vendors/nearest
Find nearest vendors to coordinates using PostGIS.

**Query Parameters:**
- `lat` (number, required): Latitude
- `lng` (number, required): Longitude
- `limit` (number, optional): Maximum results (default: 10)

**Example:**
```
GET /vendors/nearest?lat=31.9539&lng=35.9106&limit=5
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Al-Ahli Gas Company",
    "phone": "+962791234567",
    "address": "King Hussein Street",
    "latitude": 31.9539,
    "longitude": 35.9106,
    "tankPrice": 8.5,
    "serviceFee": 2.0,
    "rating": 4.5,
    "distance": 0.5
  }
]
```

#### GET /vendors/:id
Get vendor details by ID.

### Admin/Vendor Endpoints

#### POST /vendors
Create a new vendor (admin only).

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "name": "Al-Ahli Gas Company",
  "phone": "+962791234567",
  "businessLicense": "BL-2024-001",
  "address": "King Hussein Street, Amman",
  "latitude": 31.9539,
  "longitude": 35.9106,
  "tankPrice": "8.5",
  "serviceFee": "2.0",
  "isActive": true
}
```

#### PATCH /vendors/:id
Update vendor (vendor/admin only).

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "name": "Updated Name",
  "tankPrice": "9.0",
  "isActive": false
}
```

#### PUT /vendors/:id/toggle-active
Toggle vendor active status (admin only).

**Headers:**
- `Authorization: Bearer <access_token>`

## PostGIS Queries

The module uses PostGIS for accurate distance calculations:

```sql
SELECT 
  *,
  ST_Distance(
    ST_MakePoint(longitude::float, latitude::float),
    ST_MakePoint($1::float, $2::float)
  ) * 111.32 as distance_km
FROM vendors
WHERE "isActive" = true
ORDER BY distance_km
LIMIT $3
```

Distance is calculated in kilometers using the Haversine formula via PostGIS.

## Validation

- **Coordinates**: Latitude 29-34, Longitude 34-40 (Jordan bounds)
- **Phone**: Jordan format (+962XXXXXXXXX)
- **Rating**: Calculated from order ratings (0-5)

## Role-Based Access Control

- **PUBLIC**: Read-only access to vendor list
- **ADMIN**: Full access (create, update, toggle active)
- **VENDOR**: Can update their own vendor profile

## Services

### VendorsService

- `findAll(filters?)`: Get vendors with optional filters
- `findById(id)`: Get vendor by ID
- `findNearest(lat, lng, limit)`: Find nearest vendors using PostGIS
- `create(dto)`: Create new vendor
- `update(id, dto)`: Update vendor
- `toggleActive(id)`: Toggle active status
- `updateRating(id)`: Recalculate rating from order ratings

## Error Handling

- `400 Bad Request`: Validation errors, invalid coordinates
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Vendor not found





