# Orders Module

Complete order management module for Sami's List gas delivery application. This is the core business logic module.

## Features

- ✅ Complex order creation with geolocation-based vendor selection
- ✅ Order state machine with strict transition validation
- ✅ Order status history tracking
- ✅ Driver assignment workflow
- ✅ Price calculation
- ✅ Estimated delivery time calculation
- ✅ Event emission for real-time updates
- ✅ Role-based access control
- ✅ Comprehensive business rules

## Order Creation Flow

When a user creates an order:

1. **Validate Address**: Verify address belongs to user
2. **Find Nearest Vendor**: Use PostGIS to find nearest active vendor
3. **Calculate Price**: `(tankPrice * quantity) + serviceFee`
4. **Estimate Delivery**: 30-60 minutes based on distance
5. **Create Order**: Status PENDING
6. **Create History**: Initial status history entry
7. **Emit Event**: `order.created` for real-time notification

## Order State Machine

### Valid Status Transitions

```
PENDING → ACCEPTED (vendor accepts)
PENDING → REJECTED (vendor rejects)
PENDING → CANCELLED
ACCEPTED → ASSIGNED (vendor assigns driver)
ACCEPTED → CANCELLED
ASSIGNED → EN_ROUTE (driver starts delivery)
ASSIGNED → CANCELLED
EN_ROUTE → DELIVERED (driver marks as delivered)
EN_ROUTE → CANCELLED
DELIVERED → COMPLETED (payment confirmed)
```

### Terminal States
- `REJECTED`
- `COMPLETED`
- `CANCELLED`

## Business Rules

### Cancellation Rules
- **Users**: Can cancel if status is `PENDING` or `ACCEPTED`
- **Vendors**: Can cancel anytime before `EN_ROUTE`
- **Drivers**: Can cancel if `ASSIGNED` (not yet en route)

### Order Quantity
- Minimum: 1 cylinder
- Maximum: 10 cylinders

### Order Number Format
- Format: `GAS` + `YYYYMMDD` + `-` + `HHMM` + `4 random digits`
- Example: `GAS20260124-15471234`

## API Endpoints

### POST /orders
Create a new order (user only).

**Headers:**
- `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "addressId": "uuid",
  "tankQuantity": 2,
  "paymentMethod": "CASH"
}
```

**Response:**
```json
{
  "id": "uuid",
  "orderNumber": "GAS20260124-15471234",
  "status": "PENDING",
  "tankQuantity": 2,
  "tankPrice": "8.5",
  "serviceFee": "2.0",
  "totalPrice": "19.0",
  "estimatedDeliveryTime": "2024-01-24T16:17:00.000Z",
  "vendor": {
    "id": "uuid",
    "name": "Al-Ahli Gas Company",
    "distance": 2.5
  },
  "address": { ... }
}
```

### GET /orders
Get all orders with optional filters (authenticated).

**Query Parameters:**
- `userId`: Filter by user ID
- `vendorId`: Filter by vendor ID
- `driverId`: Filter by driver ID
- `status`: Filter by order status
- `dateFrom`: Filter from date (ISO 8601)
- `dateTo`: Filter to date (ISO 8601)

**Note:** Users can only see their own orders.

### GET /orders/my-orders
Get current user's orders (convenience endpoint).

### GET /orders/:id
Get order details by ID.

**Authorization:**
- Users can only view their own orders
- Vendors can view orders for their vendor
- Drivers can view assigned orders
- Admins can view all orders

### PATCH /orders/:id/status
Update order status (vendor/driver/admin).

**Request:**
```json
{
  "status": "EN_ROUTE",
  "notes": "Driver is on the way"
}
```

### PUT /orders/:id/assign-driver
Assign driver to order (vendor/admin).

**Request:**
```json
{
  "driverId": "uuid"
}
```

**Requirements:**
- Order must be in `ACCEPTED` status
- Driver must belong to order vendor
- Driver must be available

### PUT /orders/:id/cancel
Cancel order (user/vendor/driver).

**Request:**
```json
{
  "cancelledBy": "user",
  "reason": "Changed my mind"
}
```

### PUT /orders/:id/complete
Complete order after delivery (driver/admin).

**Requirements:**
- Order must be in `DELIVERED` status
- Updates vendor and driver statistics
- Recalculates ratings

## Events

The module emits the following events for real-time updates:

- `order.created`: When a new order is created
- `order.status.changed`: When order status changes
- `order.driver.assigned`: When a driver is assigned
- `order.cancelled`: When an order is cancelled
- `order.completed`: When an order is completed

**Example Event Listener:**
```typescript
@OnEvent('order.created')
handleOrderCreated(payload: { orderId: string; userId: string; vendorId: string }) {
  // Send notification, update dashboard, etc.
}
```

## Services

### OrdersService

- `create(userId, dto)`: Create new order with complex logic
- `findAll(filters, userId, role)`: Get orders with filters
- `findById(id, userId, role)`: Get order by ID with authorization
- `findByUser(userId)`: Get user's orders
- `updateStatus(id, dto, changedBy)`: Update order status
- `assignDriver(id, dto)`: Assign driver to order
- `calculatePrice(vendorId, quantity)`: Calculate order price
- `cancelOrder(id, dto)`: Cancel order with business rules
- `completeOrder(id)`: Complete order after delivery

### OrderStatusHistoryService

- `create(orderId, status, notes)`: Create history entry
- `findByOrder(orderId)`: Get all history for order
- `getLatestStatus(orderId)`: Get latest status

### OrderStateMachineService

- `isValidTransition(from, to)`: Check if transition is valid
- `validateTransition(from, to)`: Validate and throw if invalid
- `canCancel(status, cancelledBy)`: Check if order can be cancelled
- `isTerminalState(status)`: Check if status is terminal
- `getValidNextStates(status)`: Get all valid next states

## Authorization

- **USER**: Create orders, view own orders, cancel own orders (if allowed)
- **VENDOR**: View vendor orders, update status, assign drivers, cancel (if allowed)
- **DRIVER**: View assigned orders, update status, complete delivery, cancel (if allowed)
- **ADMIN**: Full access to all operations

## Error Handling

- `400 Bad Request`: Invalid state transition, validation errors, business rule violations
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions or not your order
- `404 Not Found`: Order, address, vendor, or driver not found

## Logging

All important operations are logged:
- Order creation
- Status changes (with user who made change)
- Driver assignments
- Cancellations (with reason)
- Order completions

## Unit Tests

State machine logic is covered by unit tests in `order-state-machine.service.spec.ts`:
- Valid transition validation
- Invalid transition rejection
- Cancellation rules
- Terminal state detection

## Prisma Transactions

The following operations use Prisma transactions for atomicity:
- Order creation (order + status history)
- Status updates (order + status history)
- Driver assignment (order + status history)
- Order completion (order + status history + vendor/driver stats)

## Price Calculation

```typescript
tankPrice = vendor.tankPrice
serviceFee = vendor.serviceFee
totalTankPrice = tankPrice * quantity
totalPrice = totalTankPrice + serviceFee
```

## Estimated Delivery Time

Currently uses a simple calculation:
- Base time: 30 minutes
- Additional: 1 minute per km
- Maximum: 60 minutes

Future improvements:
- Real-time traffic data
- Historical delivery times
- Driver availability





