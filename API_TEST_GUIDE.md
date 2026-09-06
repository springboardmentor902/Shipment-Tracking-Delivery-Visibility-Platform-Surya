# ShipTrack Pro - API Testing Guide

## Application Status
- **URL**: http://localhost:1022
- **Database**: PostgreSQL (Trackship_db)
- **Default Admin**: admin@shiptrack.com / Admin@123

---

## Test Environment Setup

### Postman Collection Variables
```
baseUrl = http://localhost:1022
adminToken = <obtain after login>
customerToken = <obtain after login>
operatorToken = <obtain after login>
shipmentId = <obtain after creation>
routeId = <obtain after creation>
```

---

## A) Authentication & Authorization Tests

### TC-001: Admin Login (Default Account)
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/login  
**Body**:
```json
{
  "email": "admin@shiptrack.com",
  "password": "Admin@123"
}
```
**Expected**: 200 OK, returns JWT token  
**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "fullName": "System Admin",
    "email": "admin@shiptrack.com",
    "role": "ADMINISTRATOR",
    "status": "ACTIVE"
  }
}
```
**Save**: `adminToken` from response

---

### TC-002: Register Customer
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/register  
**Body**:
```json
{
  "fullName": "John Customer",
  "email": "john@example.com",
  "password": "Customer@123",
  "phone": "+1234567890",
  "role": "CUSTOMER"
}
```
**Expected**: 201 Created  
**Response**: User details with id, email, role

---

### TC-003: Register Logistics Operator
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/register  
**Body**:
```json
{
  "fullName": "Mike Operator",
  "email": "mike@example.com",
  "password": "Operator@123",
  "phone": "+1234567891",
  "role": "LOGISTICS_OPERATOR"
}
```
**Expected**: 201 Created

---

### TC-004: Register Business Client
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/register  
**Body**:
```json
{
  "fullName": "ABC Logistics",
  "email": "business@example.com",
  "password": "Business@123",
  "phone": "+1234567892",
  "role": "BUSINESS_CLIENT"
}
```
**Expected**: 201 Created

---

### TC-005: Customer Login
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/login  
**Body**:
```json
{
  "email": "john@example.com",
  "password": "Customer@123"
}
```
**Expected**: 200 OK  
**Save**: `customerToken` from response

---

### TC-006: Operator Login
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/login  
**Body**:
```json
{
  "email": "mike@example.com",
  "password": "Operator@123"
}
```
**Expected**: 200 OK  
**Save**: `operatorToken` from response

---

### TC-007: Attempt to Register as Administrator (Should Fail)
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/register  
**Body**:
```json
{
  "fullName": "Fake Admin",
  "email": "fakeadmin@example.com",
  "password": "Admin@123",
  "role": "ADMINISTRATOR"
}
```
**Expected**: 403 Forbidden (Admin cannot be created via registration)

---

### TC-008: Duplicate Email Registration (Should Fail)
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/register  
**Body**:
```json
{
  "fullName": "Duplicate User",
  "email": "john@example.com",
  "password": "Password@123",
  "role": "CUSTOMER"
}
```
**Expected**: 409 Conflict (Email already registered)

---

### TC-009: Invalid Login Credentials
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/login  
**Body**:
```json
{
  "email": "john@example.com",
  "password": "WrongPassword"
}
```
**Expected**: 401 Unauthorized

---

## B) Shipment Management Tests

### TC-010: Create Shipment with Packages (Customer)
**Method**: POST  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Body**:
```json
{
  "senderName": "John Customer",
  "senderPhone": "+1234567890",
  "senderAddress": "123 Main St, New York, NY",
  "receiverName": "Jane Receiver",
  "receiverPhone": "+1987654321",
  "receiverEmail": "jane@example.com",
  "receiverAddress": "456 Oak Ave, Los Angeles, CA",
  "pickupAddress": "123 Main St, New York, NY",
  "deliveryAddress": "456 Oak Ave, Los Angeles, CA",
  "priority": "STANDARD",
  "packages": [
    {
      "description": "Electronics",
      "weight": 5.5,
      "length": 30.0,
      "width": 20.0,
      "height": 15.0,
      "quantity": 1,
      "declaredValue": 500.00,
      "fragile": true
    },
    {
      "description": "Books",
      "weight": 10.0,
      "length": 40.0,
      "width": 30.0,
      "height": 20.0,
      "quantity": 2,
      "declaredValue": 100.00,
      "fragile": false
    }
  ]
}
```
**Expected**: 200 OK  
**Response**: Shipment with tracking number, status "PENDING", and packages array  
**Save**: `shipmentId` from response

---

### TC-011: Create Shipment without Packages
**Method**: POST  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Body**:
```json
{
  "senderName": "John Customer",
  "senderPhone": "+1234567890",
  "senderAddress": "123 Main St, New York, NY",
  "receiverName": "Jane Receiver",
  "receiverPhone": "+1987654321",
  "receiverEmail": "jane@example.com",
  "receiverAddress": "456 Oak Ave, Los Angeles, CA",
  "pickupAddress": "123 Main St, New York, NY",
  "deliveryAddress": "456 Oak Ave, Los Angeles, CA",
  "priority": "EXPRESS"
}
```
**Expected**: 200 OK (Shipment created without packages)

---

### TC-012: Get Shipments as Customer (Should see only own shipments)
**Method**: GET  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Expected**: 200 OK, returns only shipments created by this customer

---

### TC-013: Get Shipments as Administrator (Should see all shipments)
**Method**: GET  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{adminToken}}`  
**Expected**: 200 OK, returns all shipments in system

---

### TC-014: Get Shipments as Operator (Should see assigned shipments)
**Method**: GET  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Expected**: 200 OK, returns only shipments assigned to this operator (initially empty)

---

### TC-015: Get Shipment by ID
**Method**: GET  
**URL**: {{baseUrl}}/api/shipments/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Expected**: 200 OK, returns shipment details with packages

---

### TC-016: Create Shipment without Required Fields (Should Fail)
**Method**: POST  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Body**:
```json
{
  "senderName": "John Customer",
  "receiverName": "Jane Receiver"
}
```
**Expected**: 400 Bad Request (Validation error for missing required fields)

---

## C) Route Management Tests

### TC-017: Create Route as Operator
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Body**:
```json
{
  "originAddress": "123 Main St, New York, NY",
  "destinationAddress": "456 Oak Ave, Los Angeles, CA",
  "driverId": 1
}
```
**Expected**: 200 OK  
**Response**: Route with origin/destination, coordinates (if Google Maps works), distance, estimated time  
**Save**: `routeId` from response

---

### TC-018: Create Route as Administrator
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{adminToken}}`  
**Body**:
```json
{
  "originAddress": "123 Main St, New York, NY",
  "destinationAddress": "456 Oak Ave, Los Angeles, CA",
  "driverId": 2
}
```
**Expected**: 200 OK

---

### TC-019: Create Route as Customer (Should Fail)
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Body**:
```json
{
  "originAddress": "123 Main St, New York, NY",
  "destinationAddress": "456 Oak Ave, Los Angeles, CA"
}
```
**Expected**: 403 Forbidden (Customer cannot create routes)

---

### TC-020: Get Route by Shipment ID
**Method**: GET  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Expected**: 200 OK, returns route details

---

### TC-021: Update Route Driver
**Method**: PUT  
**URL**: {{baseUrl}}/api/routes/{{routeId}}/driver/3  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Expected**: 200 OK, returns updated route with new driverId

---

### TC-022: Update Route Driver as Customer (Should Fail)
**Method**: PUT  
**URL**: {{baseUrl}}/api/routes/{{routeId}}/driver/4  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Expected**: 403 Forbidden

---

### TC-023: Create Duplicate Route (Should Fail)
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Body**:
```json
{
  "originAddress": "Different Address",
  "destinationAddress": "Another Address"
}
```
**Expected**: 409 Conflict (Route already exists for this shipment)

---

## D) Google Maps Integration Tests

### TC-024: Create Route with Valid Addresses (Google Maps Enabled)
**Prerequisite**: Set environment variable `GOOGLE_MAPS_API_KEY`  
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Body**:
```json
{
  "originAddress": "1600 Amphitheatre Parkway, Mountain View, CA",
  "destinationAddress": "1 Infinite Loop, Cupertino, CA"
}
```
**Expected**: 200 OK  
**Response should include**:
- originLatitude, originLongitude
- destinationLatitude, destinationLongitude
- distanceKm (calculated)
- estimatedTimeMinutes (calculated)

---

### TC-025: Create Route without Google Maps API Key (Graceful Degradation)
**Prerequisite**: Remove or unset `GOOGLE_MAPS_API_KEY` environment variable  
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Body**:
```json
{
  "originAddress": "123 Main St, New York, NY",
  "destinationAddress": "456 Oak Ave, Los Angeles, CA"
}
```
**Expected**: 200 OK  
**Response should include**:
- originAddress, destinationAddress (saved)
- originLatitude, originLongitude (null)
- distanceKm (null)
- estimatedTimeMinutes (null)
- Route still saved successfully despite API failure

---

### TC-026: Create Route with Invalid Address (Graceful Degradation)
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Body**:
```json
{
  "originAddress": "Invalid Nonexistent Address 99999",
  "destinationAddress": "Also Invalid Address"
}
```
**Expected**: 200 OK  
**Response**: Route saved without coordinates/distance (graceful degradation)

---

## E) Admin Management Tests

### TC-027: Get All Users (Admin Only)
**Method**: GET  
**URL**: {{baseUrl}}/api/admin/users  
**Headers**: `Authorization: Bearer {{adminToken}}`  
**Expected**: 200 OK, returns list of all users

---

### TC-028: Get All Users as Customer (Should Fail)
**Method**: GET  
**URL**: {{baseUrl}}/api/admin/users  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Expected**: 403 Forbidden

---

### TC-029: Update User Role (Admin Only)
**Method**: PUT  
**URL**: {{baseUrl}}/api/admin/users/2/role  
**Headers**: `Authorization: Bearer {{adminToken}}`  
**Body**:
```json
{
  "role": "SUPPORT_AGENT"
}
```
**Expected**: 200 OK, user role updated

---

### TC-030: Attempt to Create Second Admin (Should Fail)
**Method**: PUT  
**URL**: {{baseUrl}}/api/admin/users/3/role  
**Headers**: `Authorization: Bearer {{adminToken}}`  
**Body**:
```json
{
  "role": "ADMINISTRATOR"
}
```
**Expected**: 403 Forbidden (Only one admin allowed)

---

## F) Security Tests

### TC-031: Access Protected Endpoint Without Token
**Method**: GET  
**URL**: {{baseUrl}}/api/shipments  
**Expected**: 401 Unauthorized

---

### TC-032: Access Protected Endpoint with Invalid Token
**Method**: GET  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer invalid.token.here`  
**Expected**: 401 Unauthorized

---

### TC-033: SQL Injection Test
**Method**: POST  
**URL**: {{baseUrl}}/api/auth/register  
**Body**:
```json
{
  "fullName": "Test User'; DROP TABLE users; --",
  "email": "test@example.com",
  "password": "Password@123",
  "role": "CUSTOMER"
}
```
**Expected**: 400 Bad Request or safe handling (no SQL injection)

---

### TC-034: XSS Test
**Method**: POST  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Body**:
```json
{
  "senderName": "<script>alert('XSS')</script>",
  "senderAddress": "123 Main St",
  "receiverName": "Jane Receiver",
  "receiverAddress": "456 Oak Ave",
  "pickupAddress": "123 Main St",
  "deliveryAddress": "456 Oak Ave"
}
```
**Expected**: 200 OK (input sanitized or stored safely)

---

## G) Negative Test Cases

### TC-035: Get Non-Existent Shipment
**Method**: GET  
**URL**: {{baseUrl}}/api/shipments/99999  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Expected**: 404 Not Found

---

### TC-036: Get Non-Existent Route
**Method**: GET  
**URL**: {{baseUrl}}/api/routes/99999  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Expected**: 404 Not Found

---

### TC-037: Create Route for Non-Existent Shipment
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/99999  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Body**:
```json
{
  "originAddress": "123 Main St",
  "destinationAddress": "456 Oak Ave"
}
```
**Expected**: 404 Not Found (Shipment not found)

---

### TC-038: Create Shipment with Invalid Email
**Method**: POST  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Body**:
```json
{
  "senderName": "John",
  "senderAddress": "123 Main St",
  "receiverName": "Jane",
  "receiverEmail": "invalid-email",
  "receiverAddress": "456 Oak Ave",
  "pickupAddress": "123 Main St",
  "deliveryAddress": "456 Oak Ave"
}
```
**Expected**: 400 Bad Request (Validation error)

---

### TC-039: Create Shipment with Negative Weight
**Method**: POST  
**URL**: {{baseUrl}}/api/shipments  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Body**:
```json
{
  "senderName": "John",
  "senderAddress": "123 Main St",
  "receiverName": "Jane",
  "receiverAddress": "456 Oak Ave",
  "pickupAddress": "123 Main St",
  "deliveryAddress": "456 Oak Ave",
  "packages": [
    {
      "description": "Test",
      "weight": -5.0
    }
  ]
}
```
**Expected**: 400 Bad Request or safe handling

---

## H) WebSocket / Real-Time Tracking Tests

### TC-040: Update Driver Location
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{routeId}}/location  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```
**Expected**: 200 OK  
**Response**: Updated route with currentLatitude, currentLongitude, locationUpdatedAt

---

### TC-041: Update Driver Location as Customer (Should Fail)
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{routeId}}/location  
**Headers**: `Authorization: Bearer {{customerToken}}`  
**Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```
**Expected**: 403 Forbidden

---

### TC-042: Update Driver Location with Invalid Coordinates
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{routeId}}/location  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Body**:
```json
{
  "latitude": null,
  "longitude": -74.0060
}
```
**Expected**: 400 Bad Request (Validation error)

---

### TC-043: WebSocket Connection Test
**WebSocket URL**: ws://localhost:1022/api/ws/tracking  
**Client**: Use STOMP client (e.g., SockJS + Stomp.js in frontend)  
**Connection**:
```javascript
const socket = new SockJS('http://localhost:1022/api/ws/tracking');
const stompClient = Stomp.over(socket);
stompClient.connect({}, function(frame) {
    console.log('Connected: ' + frame);
});
```
**Expected**: Connection successful

---

### TC-044: Subscribe to Shipment Location Channel
**Channel**: /topic/shipment/{{shipmentId}}/location  
**Subscription**:
```javascript
stompClient.subscribe('/topic/shipment/{{shipmentId}}/location', function(message) {
    const locationData = JSON.parse(message.body);
    console.log('Location update:', locationData);
    // Update map marker with locationData.latitude, locationData.longitude
});
```
**Expected**: Subscription successful

---

### TC-045: Receive Real-Time Location Updates
**Prerequisites**: 
- WebSocket connected
- Subscribed to shipment channel
- Driver sends location updates via POST /api/routes/{{routeId}}/location

**Test Flow**:
1. Driver sends location: POST /api/routes/{{routeId}}/location with lat/lng
2. Backend saves location to database
3. Backend broadcasts to /topic/shipment/{{shipmentId}}/location
4. Frontend receives message via WebSocket
5. Map marker updates without page refresh

**Expected Message Format**:
```json
{
  "routeId": 1,
  "shipmentId": 1,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2026-08-19T20:45:30"
}
```

---

### TC-046: Multiple Location Updates in Sequence
**Test**: Send multiple location updates rapidly  
**Method**: POST  
**URL**: {{baseUrl}}/api/routes/{{routeId}}/location  
**Headers**: `Authorization: Bearer {{operatorToken}}`  

**Update 1**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Update 2**:
```json
{
  "latitude": 40.7130,
  "longitude": -74.0065
}
```

**Update 3**:
```json
{
  "latitude": 40.7135,
  "longitude": -74.0070
}
```

**Expected**: 
- All updates saved to database
- All updates broadcast via WebSocket
- Frontend receives all updates in sequence
- Map marker moves smoothly along path

---

### TC-047: WebSocket Disconnect/Reconnect
**Test**: 
1. Disconnect WebSocket client
2. Send location update via API
3. Reconnect WebSocket
4. Subscribe to channel
5. Send another location update

**Expected**: 
- Reconnection successful
- New location updates received after reconnect
- No data loss for new updates

---

### TC-048: Get Route with Current Location
**Method**: GET  
**URL**: {{baseUrl}}/api/routes/{{shipmentId}}  
**Headers**: `Authorization: Bearer {{operatorToken}}`  
**Expected**: 200 OK  
**Response includes**:
- currentLatitude
- currentLongitude
- locationUpdatedAt

---

## Test Summary Checklist

### A) Two Small Fixes
- [x] Package entity created with shipment_id
- [x] Multiple packages per shipment supported
- [x] Shipment creation saves package details
- [x] GET /api/shipments filters by role:
  - [x] Customer → own shipments
  - [x] Operator → assigned shipments
  - [x] Admin → all shipments
  - [x] Business Client → business shipments

### B) Route Management
- [x] Route entity created
- [x] POST /api/routes/{shipmentId} implemented
- [x] Only Operator/Admin can create routes
- [x] Driver assignment implemented
- [x] Driver change implemented
- [x] GET /api/routes/{shipmentId} implemented
- [x] Proper authentication applied
- [x] Proper authorization applied

### C) Google Maps Integration
- [x] Geocoding implemented (address → lat/lng)
- [x] Directions implemented (distance/time calculation)
- [x] Route distance/time auto-populated
- [x] API key in environment variable
- [x] No hardcoded API keys
- [x] Graceful degradation on API failure

### D) WebSocket / Real-Time Tracking
- [x] WebSocket endpoint configured (/api/ws/tracking)
- [x] STOMP message broker enabled
- [x] Route entity updated with current location fields
- [x] LocationUpdate DTO created
- [x] POST /api/routes/{routeId}/location endpoint implemented
- [x] Location saved to database
- [x] Location broadcast via WebSocket to shipment channel
- [x] Per-shipment channel (/topic/shipment/{shipmentId}/location)
- [x] Proper authorization (Operator/Admin only)

---

## Notes for Testing

1. **Environment Variables**: Set `GOOGLE_MAPS_API_KEY` before testing Google Maps features
2. **Database**: Ensure PostgreSQL is running on localhost:5432 with database `Trackship_db`
3. **Default Admin**: admin@shiptrack.com / Admin@123 is seeded at startup
4. **Token Management**: Save tokens after login for subsequent requests
5. **ID Management**: Save IDs (shipmentId, routeId) after creation for update/delete tests

---

## Expected Results Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Authentication | ✅ Implemented | JWT with role-based claims |
| Registration | ✅ Implemented | Role mandatory, admin blocked |
| Shipment CRUD | ✅ Implemented | With package support |
| Role Filtering | ✅ Implemented | Per user role |
| Route Management | ✅ Implemented | Operator/Admin only |
| Driver Assignment | ✅ Implemented | Update endpoint |
| Google Maps | ✅ Implemented | With graceful degradation |
| RBAC | ✅ Implemented | @PreAuthorize on endpoints |
| Admin Seeder | ✅ Implemented | Single admin at startup |
