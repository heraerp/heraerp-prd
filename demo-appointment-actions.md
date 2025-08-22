# Salon Appointment Actions Demo

## How Appointment Actions Work in HERA

### 1. **Edit Appointment** ✏️
- **URL**: `/salon/appointments/{id}/edit`
- **Method**: `PUT /api/v1/salon/appointments/{id}`
- **What happens**:
  - Updates appointment details in `universal_transactions`
  - Updates metadata with new service, stylist, time, etc.
  - Updates transaction lines if service price changes
  - Preserves audit trail with `updated_at` timestamp

### 2. **Cancel Appointment** ❌
- **Action**: Cancel button on appointment
- **Method**: `DELETE /api/v1/salon/appointments/{id}?reason=...`
- **What happens**:
  - Sets `transaction_status` to 'cancelled'
  - Adds cancellation metadata:
    - `cancelled_at`: timestamp
    - `cancellation_reason`: customer provided reason
    - `status`: 'cancelled'
  - Appointment remains in database (soft delete)
  - Can be viewed in "Cancelled" tab

### 3. **Check In Client** ✅
- **Action**: Check In button
- **Method**: `PATCH /api/v1/salon/appointments/{id}`
- **What happens**:
  - Updates appointment status to 'in_progress'
  - Records check-in time
  - Changes appointment display
  - Enables completion actions

### 4. **Delete Appointment** 🗑️
- **Action**: Delete button (only for cancelled appointments)
- **Method**: `PUT` with status 'deleted'
- **What happens**:
  - Sets `transaction_status` to 'deleted'
  - Removes from main view
  - Still in database for audit
  - Can be restored if needed

### 5. **Reschedule Appointment** 📅
- **Method**: `PATCH /api/v1/salon/appointments/{id}`
- **What happens**:
  - Updates `transaction_date` and time
  - Adds `rescheduled_at` timestamp
  - Notifies about schedule change
  - Preserves original booking info

## Status Flow

```
Created → Confirmed → In Progress → Completed
   ↓         ↓            ↓
Cancelled  Cancelled   Cancelled
   ↓
Deleted (Hidden)
```

## Database Structure

### Main Transaction (`universal_transactions`)
- `transaction_status`: Current status (confirmed, cancelled, in_progress, completed, deleted)
- `metadata`: All appointment details including:
  - Customer information
  - Service and stylist details
  - Status history
  - Cancellation info
  - Notes and timestamps

### Transaction Lines (`universal_transaction_lines`)
- Service details
- Pricing information
- Additional services/products

## Testing the Actions

1. **Create an appointment**:
   - Go to `/salon/appointments/new`
   - Fill form and submit

2. **Edit the appointment**:
   - Click "Edit" button
   - Change service or time
   - Save changes

3. **Cancel appointment**:
   - Click "Cancel" button
   - Enter reason
   - Appointment moves to cancelled status

4. **Check in client**:
   - Click "Check In" when client arrives
   - Status changes to in_progress

5. **Delete cancelled appointment**:
   - Go to "Cancelled" tab
   - Click "Delete" on cancelled appointment
   - Appointment is hidden (soft delete)

## Key Benefits

1. **Audit Trail**: Every action is tracked with timestamps
2. **Soft Deletes**: Data never truly deleted, just hidden
3. **Status Management**: Clear workflow from booking to completion
4. **Flexibility**: Can reschedule, modify, or cancel easily
5. **Business Intelligence**: Track cancellation reasons, no-shows, etc.

## API Examples

### Edit Appointment
```bash
curl -X PUT http://localhost:3000/api/v1/salon/appointments/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Updated Name",
    "serviceId": "2",
    "serviceName": "Hair Color",
    "servicePrice": 350,
    "time": "16:00"
  }'
```

### Cancel Appointment
```bash
curl -X DELETE "http://localhost:3000/api/v1/salon/appointments/{id}?reason=Customer%20request"
```

### Check In Client
```bash
curl -X PATCH http://localhost:3000/api/v1/salon/appointments/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "checkedInAt": "2025-08-21T15:00:00Z"
  }'
```