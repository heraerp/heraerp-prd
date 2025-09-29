# Getting Started with Salon Management

This guide will walk you through setting up your salon in the system and getting ready for your first day of operations.

## Initial Setup Process

### Step 1: Business Profile Configuration

#### Basic Information
1. Navigate to **Settings** → **Business Profile**
2. Enter your salon details:
   - Salon name
   - Business address
   - Phone number
   - Email address
   - Website (optional)
   - Tax ID/Business registration number

#### Operating Hours
1. Go to **Settings** → **Operating Hours**
2. Set your regular business hours for each day
3. Configure special hours for holidays
4. Set buffer times between appointments if needed

#### Policies
1. Navigate to **Settings** → **Policies**
2. Configure:
   - Cancellation policy (e.g., 24-hour notice required)
   - No-show policy and fees
   - Deposit requirements
   - Refund policy
   - Late arrival policy

### Step 2: Service Menu Setup

#### Creating Service Categories
1. Go to **Services** → **Categories**
2. Click **Add Category**
3. Create categories such as:
   - Hair Services
   - Nail Services
   - Spa Treatments
   - Packages
   - Add-ons

#### Adding Services
1. Navigate to **Services** → **Service List**
2. Click **Add Service** and fill in:
   - Service name
   - Category
   - Description
   - Duration (including processing time)
   - Price (including any variations)
   - Required staff level
   - Resources needed (stations, rooms)

#### Service Examples:

**Hair Services**
```
Women's Haircut
- Duration: 45 minutes
- Price: $65
- Category: Hair Services
- Add-ons: Blowdry ($25), Deep Conditioning ($30)
```

**Color Services**
```
Full Color
- Duration: 120 minutes
- Price: $120+
- Category: Hair Services
- Note: Price varies by hair length
- Processing time: 30 minutes included
```

### Step 3: Staff Management

#### Adding Staff Members
1. Go to **Staff** → **Team Members**
2. Click **Add Staff Member**
3. Enter staff information:
   - Full name
   - Role (Stylist, Colorist, Nail Tech, etc.)
   - Email and phone
   - Emergency contact
   - Hire date

#### Setting Schedules
1. For each staff member, click **Manage Schedule**
2. Set regular working hours
3. Add recurring breaks (lunch, etc.)
4. Mark vacation/time off
5. Set appointment booking rules:
   - Minimum time between appointments
   - Maximum daily appointments
   - Buffer time preferences

#### Commission Structure
1. Navigate to **Staff** → **Commission Settings**
2. Configure commission rates:
   - Service commissions (percentage or flat rate)
   - Product commission rates
   - Tiered structures based on performance
   - Special rates for certain services

### Step 4: Inventory Setup

#### Product Categories
1. Go to **Inventory** → **Categories**
2. Create categories:
   - Professional Products (back bar)
   - Retail Products
   - Tools & Equipment
   - Disposables

#### Adding Products
1. Navigate to **Inventory** → **Products**
2. Click **Add Product** and enter:
   - Product name and SKU
   - Category
   - Brand
   - Size/volume
   - Cost and retail price
   - Minimum stock level
   - Preferred supplier

#### Initial Stock Count
1. Go to **Inventory** → **Stock Count**
2. Enter current quantities for each product
3. Set reorder points
4. Note expiration dates where applicable

### Step 5: Payment Configuration

#### Payment Methods
1. Navigate to **Settings** → **Payment Settings**
2. Enable accepted payment types:
   - Cash
   - Credit/Debit cards
   - Gift cards
   - Mobile payments
   - Packages/Memberships

#### Tips Management
1. Configure tip settings:
   - Suggested tip percentages
   - Tip distribution rules
   - Cash vs. card tip handling

### Step 6: Client Data Import

#### Preparing Your Data
1. Export existing client data to CSV format
2. Ensure columns match:
   - First Name
   - Last Name
   - Email
   - Phone
   - Birthday (optional)
   - Notes (optional)

#### Importing Clients
1. Go to **Clients** → **Import**
2. Upload your CSV file
3. Map columns to system fields
4. Review and confirm import
5. System will flag any duplicates

### Step 7: Online Booking Setup

#### Booking Widget
1. Navigate to **Settings** → **Online Booking**
2. Customize booking interface:
   - Choose color scheme
   - Upload logo
   - Set welcome message
   - Configure booking rules

#### Booking Rules
- Advance booking window (e.g., up to 60 days)
- Same-day booking cutoff
- Services available online
- Staff member selection options
- Required deposit amount

#### Website Integration
1. Copy the booking widget code
2. Add to your website:
```html
<iframe src="your-booking-url" 
        width="100%" 
        height="600" 
        frameborder="0">
</iframe>
```

Or use the booking button:
```html
<a href="your-booking-url" class="book-now-button">
  Book Appointment
</a>
```

### Step 8: Communication Setup

#### Appointment Reminders
1. Go to **Communications** → **Automated Messages**
2. Enable reminder types:
   - Email reminders
   - SMS reminders
   - Push notifications

3. Set timing:
   - 48 hours before: Email reminder
   - 24 hours before: SMS reminder
   - 2 hours before: Final reminder

#### Message Templates
Customize reminder messages with variables:
```
Hi {client_name}! This is a reminder of your 
{service_name} appointment tomorrow at {time} 
with {staff_name}. 

Reply C to confirm or call us to reschedule.
```

### Step 9: Testing Your Setup

#### Test Appointment
1. Create a test client account
2. Book an appointment online
3. Verify:
   - Appointment appears in calendar
   - Reminders are sent
   - Staff member is notified
   - Time slots are blocked correctly

#### Test Sale
1. Process a test service checkout
2. Add a product sale
3. Process payment
4. Verify:
   - Receipt is generated
   - Inventory is updated
   - Commission is calculated
   - Reports reflect the sale

### Step 10: Staff Training

#### Basic Training Checklist
- [ ] Logging in and navigation
- [ ] Viewing their schedule
- [ ] Checking in clients
- [ ] Processing sales
- [ ] Managing their calendar
- [ ] Updating client notes

#### Advanced Training
- [ ] Running reports
- [ ] Managing inventory
- [ ] Handling refunds
- [ ] Creating packages
- [ ] Marketing features

## First Day Checklist

### Morning Preparation
- [ ] Verify all staff are logged in
- [ ] Check today's appointments
- [ ] Confirm inventory levels
- [ ] Test payment terminal
- [ ] Review any special requests

### During Operations
- [ ] Check in clients upon arrival
- [ ] Update service tickets in real-time
- [ ] Process payments immediately
- [ ] Book follow-up appointments
- [ ] Update client preferences

### End of Day
- [ ] Complete cash reconciliation
- [ ] Review tomorrow's schedule
- [ ] Check inventory needs
- [ ] Send confirmation reminders
- [ ] Back up any manual records

## Quick Tips for Success

### 📱 **Mobile First**
Train staff to use mobile devices for:
- Checking schedules on the go
- Updating client notes immediately
- Taking before/after photos
- Processing quick sales

### 📊 **Data Entry Discipline**
- Always complete client records
- Log all services performed
- Track product usage
- Note client preferences
- Record no-shows

### 🎯 **Maximize Features**
- Use wait lists for cancellations
- Set up recurring appointments
- Create service packages
- Implement loyalty rewards
- Automate birthday offers

### 🔄 **Regular Maintenance**
- Weekly inventory counts
- Monthly staff schedule reviews
- Quarterly service menu updates
- Annual policy reviews

## Common Setup Questions

### How long does setup take?
Most salons can complete basic setup in 2-4 hours and be fully operational within a day.

### Can I import from my previous system?
Yes, we support imports from most major salon software. Contact support for assistance.

### Do I need to train all staff at once?
No, you can start with key personnel and roll out to others gradually.

### Can I change settings after going live?
Yes, all settings can be modified at any time without disrupting operations.

## Next Steps

Now that your salon is set up, explore these features:
- [Appointment Management](/docs/salon/appointments) - Master scheduling and booking
- [Client Management](/docs/salon/clients) - Build lasting relationships
- [Point of Sale](/docs/salon/pos) - Process transactions efficiently
- [Marketing Tools](/docs/salon/marketing) - Grow your business

Need help? Contact our support team or visit the [troubleshooting guide](/docs/salon/troubleshooting).