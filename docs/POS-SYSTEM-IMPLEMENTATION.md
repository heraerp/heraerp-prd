# Point of Sale (POS) System Implementation

## Overview

The HERA Point of Sale system is a comprehensive, full-featured POS solution built using the Sacred Six Tables architecture. It provides a modern, intuitive interface for restaurant operations with real-time order processing, multi-payment options, and seamless integration with other HERA modules.

## Access

- **Standalone POS**: `http://localhost:3001/pos`
- **Restaurant POS**: `http://localhost:3001/restaurant/pos`
- **Restaurant Module**: `http://localhost:3001/restaurant` → POS Tab
- **Navigation**: Click "POS" in the main navigation bar
- **Icon**: Credit Card icon in the navigation

## Key Features

### 1. **Dual-Panel Interface**
- **Left Panel**: Menu item browsing and selection
- **Right Panel**: Shopping cart and order management

### 2. **Menu Management**
- **Grid/List View Toggle**: Switch between visual grid and compact list views
- **Category Filtering**: Filter by Appetizers, Salads, Pizza, Pasta, Main Course, Desserts, Beverages
- **Search Functionality**: Real-time search across menu items and descriptions
- **Visual Icons**: Category-specific icons for quick identification
- **Customization Support**: Items marked as "Customizable" for modifiers

### 3. **Order Types**
- **Dine-in**: Table selection with available tables only
- **Takeout**: Customer info collection for pickup
- **Delivery**: Full address and contact details capture

### 4. **Cart Management**
- **Quick Add**: Single-click to add items
- **Quantity Control**: Plus/minus buttons for quantity adjustment
- **Line Item Pricing**: Individual and total pricing display
- **Remove Items**: X button to remove items from cart
- **Clear Cart**: One-click cart clearing

### 5. **Pricing & Discounts**
- **Subtotal Calculation**: Automatic price calculation
- **Discount System**: Percentage-based discounts (5%, 10%, 15%, 20% quick buttons)
- **Tax Calculation**: Automatic 5% tax calculation
- **Total Display**: Large, clear total amount display

### 6. **Payment Processing**
- **Multiple Payment Methods**:
  - Cash (with change calculation)
  - Card (credit/debit)
  - Online (digital payments)
- **Payment Dialog**: Clean payment interface
- **Order Completion**: Confirmation with order number

### 7. **Customer Information**
- **Dine-in**: Table number selection
- **Takeout/Delivery**: Name and phone required
- **Delivery**: Additional address field

## Menu Items

### Default Menu (21 Items)
- **Appetizers**: Bruschetta, Calamari Fritti, Garlic Bread
- **Salads**: Caesar Salad, Caprese Salad
- **Pizza**: Margherita, Pepperoni, Quattro Formaggi
- **Pasta**: Carbonara, Arrabbiata, Alfredo
- **Main Course**: Grilled Salmon, Chicken Parmigiana, Osso Buco
- **Desserts**: Tiramisu, Panna Cotta, Gelato
- **Beverages**: Soft Drinks, Italian Soda, Espresso, Cappuccino

## Technical Implementation

### Data Model
```typescript
// Menu Item Entity
{
  entity_type: 'menu_item',
  entity_name: 'Margherita Pizza',
  entity_code: 'PIZ-001',
  metadata: {
    category: 'Pizza',
    price: 16.00,
    description: 'Fresh mozzarella, tomato, basil',
    available: true,
    modifiers: ['Small -$3', 'Large +$4', 'Extra Cheese +$2'],
    preparation_time: 20
  }
}

// Order Transaction
{
  transaction_type: 'sale',
  transaction_code: 'ORD-123456',
  total_amount: 125.50,
  metadata: {
    order_number: 'ORD-123456',
    order_type: 'dine-in',
    table_number: 5,
    customer_name: 'Walk-in',
    status: 'new',
    payment_method: 'card',
    items_count: 4
  }
}
```

### Smart Codes Used
- `HERA.RESTAURANT.MENU.ITEM.v1` - Menu items
- `HERA.RESTAURANT.POS.SALE.v1` - Sales transactions
- `HERA.RESTAURANT.POS.LINE.ITEM.v1` - Order line items
- `HERA.RESTAURANT.TABLE.ENTITY.v1` - Restaurant tables
- `HERA.RESTAURANT.CUSTOMER.ENTITY.v1` - Customer records

## User Interface

### Visual Design
- **Clean Layout**: Two-panel design for efficiency
- **Responsive**: Works on tablets and desktops
- **Dark Mode Support**: Full theme compatibility
- **Status Colors**: Visual feedback for actions
- **Loading States**: Smooth transitions during processing

### Workflow
1. **Select Order Type**: Dine-in, Takeout, or Delivery
2. **Add Items**: Browse and click items to add
3. **Adjust Quantities**: Use +/- buttons
4. **Apply Discounts**: Optional percentage discounts
5. **Enter Customer Info**: Based on order type
6. **Process Payment**: Select method and complete
7. **Order Confirmation**: Receive order number

## Integration Points

### With Other Modules
- **Restaurant Module**: Shares menu items and configuration
- **Kitchen Display**: Orders flow to kitchen system
- **Order Management**: View in Orders tab
- **Table Management**: Real-time table status updates
- **Inventory**: Stock deduction on sale

### Future Enhancements
1. **Modifier Selection**: UI for item customization
2. **Split Bills**: Multiple payment methods per order
3. **Loyalty Integration**: Customer points and rewards
4. **Printer Integration**: Receipt and kitchen printing
5. **Offline Mode**: Continue selling without internet
6. **Barcode Scanning**: Quick item addition
7. **Employee Management**: Clock in/out, permissions
8. **Tips Management**: Tip distribution system

## Demo Mode Features

The POS system includes realistic demo data:
- **21 Menu Items** across all categories
- **8 Tables** with availability status
- **Price Ranges**: $3-$32 per item
- **Modifiers**: Various customization options
- **Categories**: Full restaurant menu structure

## Business Benefits

- **Speed**: Quick order entry with single-click items
- **Accuracy**: Automatic calculations reduce errors
- **Flexibility**: Multiple order types and payment methods
- **Integration**: Seamless connection to all restaurant operations
- **Scalability**: Handles high-volume operations

## Sacred Six Tables Compliance

1. **core_organizations**: Mario's Restaurant context
2. **core_entities**: Menu items, tables, customers
3. **core_dynamic_data**: Item modifiers and customizations
4. **core_relationships**: Order-table-customer links
5. **universal_transactions**: Order headers with totals
6. **universal_transaction_lines**: Individual order items

The POS system demonstrates HERA's ability to build complex, user-friendly applications while maintaining the universal architecture principles!