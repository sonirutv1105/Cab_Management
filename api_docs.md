# External Booking API Documentation

This document describes the API for integrating external web applications (e.g., WordPress, custom sites) with the Cab Management System.

## Base URL
`/api/v1/bookings`

## Authentication
All requests must include the `x-api-key` header.
- **Header Name**: `x-api-key`
- **Header Value**: Your Integration API Key (generate this via the Integration Management Dashboard).

---

## 1. Import a Booking
`POST /import`

Imports a new booking into the Cab Management System.

**Headers:**
```http
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

**Payload Schema:**
| Field                 | Type   | Required | Description |
|-----------------------|--------|----------|-------------|
| `external_booking_id` | string | Yes      | A unique identifier from your system. (Prevents duplicate bookings) |
| `passengerName`       | string | Yes      | Full name of the passenger |
| `bookingDate`         | string | Yes      | Date of travel (YYYY-MM-DD) |
| `rideTime`            | string | Yes      | Time of travel (HH:MM) |
| `pickupPoint`         | string | Yes      | Pickup location address |
| `dropPoint`           | string | Yes      | Dropoff location address |
| `purpose`             | string | No       | Purpose of travel (Default: "Corporate Travel") |
| `source`              | string | No       | Name of your platform (Default: "API") |

**Example Request:**
```json
{
  "external_booking_id": "WEB-100234",
  "passengerName": "John Doe",
  "bookingDate": "2026-08-15",
  "rideTime": "10:30",
  "pickupPoint": "Airport Terminal 1",
  "dropPoint": "City Center Hotel",
  "purpose": "Business Meeting",
  "source": "Company Website"
}
```

**Example Response (201 Created):**
```json
{
  "status": "success",
  "message": "Booking imported successfully",
  "data": {
    "booking_id": 452,
    "external_id": "WEB-100234"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing API Key
- `403 Forbidden`: Invalid or inactive API Key
- `409 Conflict`: A booking with this `external_booking_id` already exists

---

## 2. Check Booking Status
`GET /status/{external_booking_id}`

Retrieve the current processing status of an imported booking.

**Response:**
```json
{
  "status": "success",
  "data": {
    "external_id": "WEB-100234",
    "internal_id": 452,
    "manager_status": "Approved",
    "hr_status": "Allocated",
    "sync_status": "Synced"
  }
}
```

---

## 3. Cancel Booking
`POST /cancel/{external_booking_id}`

Cancel an existing booking (Only works if a Cab has not been allocated yet).

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Booking cancelled successfully"
}
```

**Error Responses:**
- `400 Bad Request`: "Cannot cancel allocated booking" if the HR has already assigned a vehicle.
