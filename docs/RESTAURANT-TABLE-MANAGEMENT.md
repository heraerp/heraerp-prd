# Restaurant Table Management Implementation

## Overview

The Table Management module for Mario's Restaurant provides comprehensive floor plan visualization, real-time table status tracking, and reservation management using the Sacred Six Tables architecture.

## Access URLs

- **Direct Access**: `http://localhost:3001/restaurant/tables`
- **Via Restaurant Module**: `http://localhost:3001/restaurant` → Tables Tab

## Features Implemented

### 1. **Visual Floor Plan**
- Interactive floor plan with drag-and-drop table visualization
- 4 restaurant sections: Main Dining, Private Dining, Patio, Bar
- Visual table shapes: Square, Round, Rectangle
- Real-time status colors:
  - 🟢 Available (Green) - Ready for guests
  - 🔴 Occupied (Red) - Currently in use
  - 🟠 Reserved (Amber) - Upcoming reservation
  - 🔵 Cleaning (Blue) - Being cleaned
  - ⚫ Maintenance (Gray) - Out of service
- Click-to-select table details popup
- Section filtering for focused view

### 2. **Table Configuration**
- **24 Default Tables** across 4 sections
- Customizable properties:
  - Table number and name
  - Section assignment
  - Seating capacity (2-10 seats)
  - Table shape (visual representation)
  - Position on floor plan
  - Special notes

### 3. **Real-Time Status Management**
- Quick status changes with single click
- Automatic tracking:
  - Occupied since timestamp
  - Estimated clear time (90 min default)
  - Current server assignment
- Status workflow:
  - Available → Occupied → Cleaning → Available
  - Available → Reserved (via reservation)
- 30-second auto-refresh for live updates

### 4. **Reservation System**
- Complete reservation management
- Reservation details:
  - Customer name and phone
  - Party size
  - Date and time
  - Table assignment
  - Special requests
  - Duration (default 90 minutes)
- Automatic confirmation codes (RES123456 format)
- Reservation statuses:
  - Confirmed ✅
  - Pending ⏳
  - Cancelled ❌
  - Completed ✓
- Same-day reservations auto-update table status

### 5. **Statistics Dashboard**
- **Total Tables**: Count of all tables
- **Available**: Tables ready for seating
- **Occupied**: Currently in use
- **Reserved**: Upcoming reservations
- **Total Seats**: Restaurant capacity
- **Today's Reservations**: Confirmed bookings

### 6. **Three View Modes**
1. **Floor Plan View**
   - Visual restaurant layout
   - Interactive table selection
   - Quick status updates
   - Section-based organization

2. **Tables List View**
   - Tabular data display
   - Search functionality
   - Sortable columns
   - Bulk actions

3. **Reservations View**
   - All reservations list
   - Filter by date/status
   - Quick actions
   - Confirmation tracking

## Data Model

### Table Entity
```typescript
{
  entity_type: 'table',
  entity_name: 'Table 1',
  entity_code: 'TBL-001',
  smart_code: 'HERA.RESTAURANT.TABLE.ENTITY.v1',
  metadata: {
    table_number: 1,
    section: 'Main Dining',
    capacity: 4,
    status: 'available',
    shape: 'square',
    position: { x: 50, y: 50 },
    server_name: 'Sarah',
    server_id: 'server-uuid',
    current_order_id: 'order-uuid',
    occupied_since: '2024-01-15T18:30:00Z',
    estimated_clear_time: '2024-01-15T20:00:00Z',
    notes: 'Near window'
  }
}
```

### Reservation Entity
```typescript
{
  entity_type: 'reservation',
  entity_name: 'Smith Party',
  entity_code: 'RES-2024-001',
  smart_code: 'HERA.RESTAURANT.TABLE.RESERVATION.v1',
  metadata: {
    table_id: 'table-uuid',
    table_number: 9,
    customer_name: 'John Smith',
    phone: '+1-555-0123',
    party_size: 4,
    reservation_date: '2024-01-15',
    reservation_time: '19:00',
    duration_minutes: 120,
    special_requests: 'Anniversary dinner, window seat',
    status: 'confirmed',
    confirmation_code: 'RES123456'
  }
}
```

## Smart Codes Used

### Table Management
- `HERA.RESTAURANT.TABLE.ENTITY.v1` - Table entities
- `HERA.RESTAURANT.TABLE.SECTION.v1` - Table sections
- `HERA.RESTAURANT.TABLE.RESERVATION.v1` - Reservations
- `HERA.RESTAURANT.TABLE.WAITLIST.v1` - Waitlist entries

### Table Transactions
- `HERA.RESTAURANT.TABLE.ASSIGN.v1` - Table assignments
- `HERA.RESTAURANT.TABLE.TRANSFER.v1` - Table transfers
- `HERA.RESTAURANT.TABLE.MERGE.v1` - Merge tables
- `HERA.RESTAURANT.TABLE.SPLIT.v1` - Split tables
- `HERA.RESTAURANT.TABLE.BOOKING.v1` - Reservation bookings

### Relationships
- `HERA.RESTAURANT.TABLE.REL.SECTION.v1` - Table to section
- `HERA.RESTAURANT.TABLE.REL.ORDER.v1` - Table to order
- `HERA.RESTAURANT.TABLE.REL.SERVER.v1` - Table to server
- `HERA.RESTAURANT.TABLE.REL.RESERVATION.v1` - Table to reservation

## Universal Patterns Used

1. **Visual Component Pattern**: Interactive floor plan visualization
2. **Status Management**: Real-time status updates with optimistic UI
3. **Auto-refresh**: 30-second interval for live data
4. **Search & Filter**: Multi-criteria filtering
5. **Dialog Forms**: Consistent add/edit patterns
6. **Demo Mode**: Realistic demo data for testing

## User Interface Features

### Floor Plan Visualization
- **Drag-and-drop** table positioning (future)
- **Shape representation**: Visual table shapes
- **Color coding**: Status-based colors
- **Interactive popups**: Click for details
- **Section labels**: Clear area demarcation
- **Legend**: Status color reference

### Table Actions
- **Quick Assign/Clear**: Single-click status change
- **Reserve Table**: Direct reservation creation
- **Clean Table**: Mark for cleaning
- **View Details**: Comprehensive information

### Reservation Features
- **Smart defaults**: Today's date, 90-min duration
- **Table availability**: Filter maintenance tables
- **Confirmation codes**: Auto-generated unique codes
- **Special requests**: Free-text field
- **Quick actions**: Edit/Cancel reservations

## Integration Points

### With Other Modules
- **POS Terminal**: Link orders to tables
- **Kitchen Display**: Show table numbers on orders
- **Server Management**: Assign servers to sections
- **Analytics**: Table turnover reports

### Future Enhancements
1. **Drag-and-Drop Floor Plan Editor**
2. **Multi-Floor Support**
3. **Table Combination/Splitting**
4. **Waitlist Management**
5. **SMS/Email Notifications**
6. **Table Turn Time Analytics**
7. **Heat Map Visualization**
8. **Mobile Host App**

## Testing the Module

1. **View Floor Plan**:
   - Navigate to Tables tab
   - See visual restaurant layout
   - Click tables for details

2. **Change Table Status**:
   - Click any available table
   - Press "Assign" to mark occupied
   - Press "Clear" to make available

3. **Create Reservation**:
   - Click "New Reservation"
   - Fill customer details
   - Select table and time
   - Get confirmation code

4. **Search Tables**:
   - Use search box in list view
   - Filter by section
   - Find by server name

## Sacred Six Tables Usage

1. **core_organizations**: Mario's Restaurant context
2. **core_entities**: Tables and reservations as entities
3. **core_dynamic_data**: Custom table properties
4. **core_relationships**: Table-order-server relationships
5. **universal_transactions**: Table assignments and bookings
6. **universal_transaction_lines**: Future: Split checks by table

The table management module provides restaurant floor control while maintaining HERA's universal architecture principles!

## Demo Mode Features

When accessed in demo mode, the module creates:
- **24 tables** across 4 sections
- **8 occupied tables** with random times
- **4 reserved tables** 
- **8 available tables**
- **4 tables being cleaned**
- **2 sample reservations** for today

This comprehensive implementation ensures efficient table management and guest seating optimization!